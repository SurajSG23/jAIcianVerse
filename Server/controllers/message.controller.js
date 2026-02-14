import Message from "../models/message.model.js";
import Chat from "../models/chat.model.js";
import asyncHandler from "express-async-handler";

// ── Send message (REST fallback — primary path is via socket) ───────
const sendMessage = asyncHandler(async (req, res) => {
  const { chatId, content, type, imageUrl, replyTo } = req.body;

  if (!chatId || !content) {
    res.status(400);
    throw new Error("chatId and content are required");
  }

  let message = await Message.create({
    sender: req.user._id,
    chat: chatId,
    content,
    type: type || "text",
    imageUrl,
    replyTo,
    readBy: [req.user._id],
  });

  await Chat.findByIdAndUpdate(chatId, { latestMessage: message._id });

  message = await Message.findById(message._id)
    .populate("sender", "name email profileImage")
    .populate("chat")
    .populate("replyTo");

  res.status(201).json(message);
});

// ── Get messages for a chat (with pagination) ───────────────────────
const getMessages = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const skip = (page - 1) * limit;

  const total = await Message.countDocuments({ chat: chatId });

  const messages = await Message.find({ chat: chatId })
    .populate("sender", "name email profileImage")
    .populate("replyTo")
    .sort({ createdAt: 1 })
    .skip(skip)
    .limit(limit);

  res.json({
    messages,
    page,
    totalPages: Math.ceil(total / limit),
    total,
  });
});

// ── Search messages inside a chat ───────────────────────────────────
const searchMessages = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const { q } = req.query;

  if (!q) {
    res.status(400);
    throw new Error("Search query is required");
  }

  const messages = await Message.find({
    chat: chatId,
    content: { $regex: q, $options: "i" },
    isDeleted: false,
  })
    .populate("sender", "name email profileImage")
    .sort({ createdAt: -1 })
    .limit(50);

  res.json(messages);
});

export default {
  sendMessage,
  getMessages,
  searchMessages,
};
