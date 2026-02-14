import Chat from "../models/chat.model.js";
import Message from "../models/message.model.js";
import User from "../models/user.model.js";
import asyncHandler from "express-async-handler";

// ── Access or create a 1-on-1 chat ─────────────────────────────────
const accessChat = asyncHandler(async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    res.status(400);
    throw new Error("userId param is required");
  }

  let chat = await Chat.find({
    isGroupChat: false,
    $and: [
      { users: { $elemMatch: { $eq: req.user._id } } },
      { users: { $elemMatch: { $eq: userId } } },
    ],
  })
    .populate("users", "-password")
    .populate({
      path: "latestMessage",
      populate: { path: "sender", select: "name email profileImage" },
    });

  if (chat.length > 0) {
    return res.json(chat[0]);
  }

  // Create new chat
  const newChat = await Chat.create({
    chatName: "sender",
    isGroupChat: false,
    users: [req.user._id, userId],
  });

  const fullChat = await Chat.findById(newChat._id).populate(
    "users",
    "-password"
  );

  res.status(201).json(fullChat);
});

// ── Get all chats for authenticated user ────────────────────────────
const fetchChats = asyncHandler(async (req, res) => {
  const chats = await Chat.find({
    users: { $elemMatch: { $eq: req.user._id } },
  })
    .populate("users", "-password")
    .populate("groupAdmin", "-password")
    .populate({
      path: "latestMessage",
      populate: { path: "sender", select: "name email profileImage" },
    })
    .sort({ updatedAt: -1 });

  res.json(chats);
});

// ── Create a group chat ─────────────────────────────────────────────
const createGroupChat = asyncHandler(async (req, res) => {
  const { users, name } = req.body;

  if (!users || !name) {
    res.status(400);
    throw new Error("Please provide group name and users");
  }

  const parsedUsers = typeof users === "string" ? JSON.parse(users) : users;

  if (parsedUsers.length < 2) {
    res.status(400);
    throw new Error("At least 2 other users required for a group");
  }

  parsedUsers.push(req.user._id);

  const groupChat = await Chat.create({
    chatName: name,
    isGroupChat: true,
    users: parsedUsers,
    groupAdmin: req.user._id,
  });

  const fullChat = await Chat.findById(groupChat._id)
    .populate("users", "-password")
    .populate("groupAdmin", "-password");

  res.status(201).json(fullChat);
});

// ── Rename group ────────────────────────────────────────────────────
const renameGroup = asyncHandler(async (req, res) => {
  const { chatId, chatName } = req.body;

  const chat = await Chat.findByIdAndUpdate(chatId, { chatName }, { new: true })
    .populate("users", "-password")
    .populate("groupAdmin", "-password");

  if (!chat) {
    res.status(404);
    throw new Error("Chat not found");
  }

  res.json(chat);
});

// ── Add user to group ───────────────────────────────────────────────
const addToGroup = asyncHandler(async (req, res) => {
  const { chatId, userId } = req.body;

  const chat = await Chat.findByIdAndUpdate(
    chatId,
    { $addToSet: { users: userId } },
    { new: true }
  )
    .populate("users", "-password")
    .populate("groupAdmin", "-password");

  if (!chat) {
    res.status(404);
    throw new Error("Chat not found");
  }

  res.json(chat);
});

// ── Remove user from group ──────────────────────────────────────────
const removeFromGroup = asyncHandler(async (req, res) => {
  const { chatId, userId } = req.body;

  const chat = await Chat.findByIdAndUpdate(
    chatId,
    { $pull: { users: userId } },
    { new: true }
  )
    .populate("users", "-password")
    .populate("groupAdmin", "-password");

  if (!chat) {
    res.status(404);
    throw new Error("Chat not found");
  }

  res.json(chat);
});

// ── Search users ────────────────────────────────────────────────────
const searchUsers = asyncHandler(async (req, res) => {
  const keyword = req.query.search
    ? {
        $or: [
          { name: { $regex: req.query.search, $options: "i" } },
          { email: { $regex: req.query.search, $options: "i" } },
        ],
      }
    : {};

  const users = await User.find(keyword)
    .find({ _id: { $ne: req.user._id } })
    .select("-password")
    .limit(20);

  res.json(users);
});

export default {
  accessChat,
  fetchChats,
  createGroupChat,
  renameGroup,
  addToGroup,
  removeFromGroup,
  searchUsers,
};
