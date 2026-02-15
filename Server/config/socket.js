import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import Chat from "../models/chat.model.js";
import Message from "../models/message.model.js";

/** @type {Map<string, Set<string>>} userId → Set of socket IDs */
const onlineUsers = new Map();

function getOnlineUserIds() {
  return Array.from(onlineUsers.keys());
}

/**
 * Initialise Socket.IO on an existing HTTP server.
 * Returns the io instance so app.js can export it if needed.
 */
export default function initSocket(server) {
  const io = new Server(server, {
    pingTimeout: 60000,
    cors: {
      origin: ["http://localhost:5173", "http://localhost:5174"],
      credentials: true,
    },
  });

  // Auth middleware 
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token || socket.handshake.query?.token;
      if (!token) return next(new Error("Authentication error"));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("-password");
      if (!user) return next(new Error("User not found"));

      socket.user = user;
      next();
    } catch (err) {
      next(new Error("Authentication error"));
    }
  });

  // Connection handler 
  io.on("connection", (socket) => { 
    const userId = socket.user._id.toString();
    console.log(`Socket connected: ${socket.user.name} (${userId})`);

    // Track online status
    if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
    onlineUsers.get(userId).add(socket.id);

    // Join personal room
    socket.join(userId);

    // Broadcast updated online list
    io.emit("online_users", getOnlineUserIds());

    // Setup: join all chat rooms the user belongs to 
    socket.on("setup", async () => {
      try {
        const chats = await Chat.find({ users: userId }).select("_id");
        chats.forEach((c) => socket.join(c._id.toString()));
        socket.emit("setup_complete");
      } catch (err) {
        socket.emit("error", { message: "Setup failed" });
      }
    });

    // Join a specific chat room 
    socket.on("join_chat", (chatId) => {
      socket.join(chatId);
    });

    // Send message
    socket.on("send_message", async (data) => {
      // data: { chatId, content, type?, imageUrl?, replyTo? }
      try {
        let message = await Message.create({
          sender: userId,
          chat: data.chatId,
          content: data.content,
          type: data.type || "text",
          imageUrl: data.imageUrl || undefined,
          replyTo: data.replyTo || undefined,
          forwardedFrom: data.forwardedFrom || undefined,
          readBy: [userId],
        });

        // Update latest message on chat
        await Chat.findByIdAndUpdate(data.chatId, {
          latestMessage: message._id,
        });

        // Populate for broadcast
        message = await Message.findById(message._id)
          .populate("sender", "name email profileImage")
          .populate("chat")
          .populate("replyTo");

        const chat = await Chat.findById(data.chatId).populate(
          "users",
          "_id"
        );

        // Emit to all users in the chat room
        chat.users.forEach((u) => {
          const recipientId = u._id.toString();
          if (recipientId === userId) return;
          io.to(recipientId).emit("receive_message", message);
        });

        // Acknowledge back to sender
        socket.emit("message_sent", message);
      } catch (err) {
        console.error("send_message error:", err);
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    // Typing indicators 
    socket.on("typing", ({ chatId }) => {
      socket.to(chatId).emit("typing", { chatId, userId });
    });

    socket.on("stop_typing", ({ chatId }) => {
      socket.to(chatId).emit("stop_typing", { chatId, userId });
    });

    // Read receipts
    socket.on("read_message", async ({ chatId, messageIds }) => {
      try {
        await Message.updateMany(
          { _id: { $in: messageIds }, readBy: { $ne: userId } },
          { $addToSet: { readBy: userId } }
        );
        socket.to(chatId).emit("messages_read", {
          chatId,
          messageIds,
          readBy: userId,
        });
      } catch (err) {
        console.error("read_message error:", err);
      }
    });

    // Edit message
    socket.on("edit_message", async ({ messageId, chatId, content }) => {
      try {
        const msg = await Message.findById(messageId);
        if (!msg || msg.sender.toString() !== userId) return;

        msg.content = content;
        msg.isEdited = true;
        await msg.save();

        const populated = await Message.findById(messageId)
          .populate("sender", "name email profileImage")
          .populate("replyTo");

        io.to(chatId).emit("message_edited", populated);
      } catch (err) {
        console.error("edit_message error:", err);
      }
    });

    // Delete message
    socket.on("delete_message", async ({ messageId, chatId }) => {
      try {
        const msg = await Message.findById(messageId);
        if (!msg || msg.sender.toString() !== userId) return;

        msg.isDeleted = true;
        msg.content = "This message was deleted";
        await msg.save();

        io.to(chatId).emit("message_deleted", { messageId, chatId });
      } catch (err) {
        console.error("delete_message error:", err);
      }
    });

    // Create group
    socket.on("create_group", async ({ name, userIds }) => {
      try {
        if (!userIds || userIds.length < 2) {
          return socket.emit("error", {
            message: "At least 2 other users required for a group",
          });
        }

        const allUsers = [...new Set([userId, ...userIds])];

        const chat = await Chat.create({
          chatName: name,
          isGroupChat: true,
          users: allUsers,
          groupAdmin: userId,
        });

        const fullChat = await Chat.findById(chat._id)
          .populate("users", "-password")
          .populate("groupAdmin", "-password");

        // Make every member join the room
        allUsers.forEach((uid) => {
          io.to(uid).emit("group_created", fullChat);
        });
      } catch (err) {
        console.error("create_group error:", err);
        socket.emit("error", { message: "Failed to create group" });
      }
    });

    // Join / add to group 
    socket.on("join_group", async ({ chatId, userIdToAdd }) => {
      try {
        const chat = await Chat.findById(chatId);
        if (!chat || !chat.isGroupChat) return;

        const targetUserId = userIdToAdd || userId;

        if (chat.users.map(String).includes(targetUserId)) return;

        chat.users.push(targetUserId);
        await chat.save();

        const fullChat = await Chat.findById(chatId)
          .populate("users", "-password")
          .populate("groupAdmin", "-password");

        io.to(chatId).emit("group_updated", fullChat);
        io.to(targetUserId).emit("group_created", fullChat);
      } catch (err) {
        console.error("join_group error:", err);
      }
    });

    // Leave group 
    socket.on("leave_group", async ({ chatId }) => {
      try {
        const chat = await Chat.findById(chatId);
        if (!chat || !chat.isGroupChat) return;

        chat.users = chat.users.filter((u) => u.toString() !== userId);
        await chat.save();

        socket.leave(chatId);

        const fullChat = await Chat.findById(chatId)
          .populate("users", "-password")
          .populate("groupAdmin", "-password");

        io.to(chatId).emit("group_updated", fullChat);
        socket.emit("left_group", { chatId });
      } catch (err) {
        console.error("leave_group error:", err);
      }
    });

    // Remove from group (admin only) 
    socket.on("remove_from_group", async ({ chatId, userIdToRemove }) => {
      try {
        const chat = await Chat.findById(chatId);
        if (
          !chat ||
          !chat.isGroupChat ||
          chat.groupAdmin.toString() !== userId
        )
          return;

        chat.users = chat.users.filter(
          (u) => u.toString() !== userIdToRemove
        );
        await chat.save();

        const fullChat = await Chat.findById(chatId)
          .populate("users", "-password")
          .populate("groupAdmin", "-password");

        io.to(chatId).emit("group_updated", fullChat);
        io.to(userIdToRemove).emit("removed_from_group", { chatId });
      } catch (err) {
        console.error("remove_from_group error:", err);
      }
    });

    // Disconnect 
    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${socket.user.name}`);
      const sockets = onlineUsers.get(userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) onlineUsers.delete(userId);
      }
      io.emit("online_users", getOnlineUserIds());
    });
  });

  return io;
}
