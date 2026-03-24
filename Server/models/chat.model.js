import mongoose from "mongoose";

const chatSchema = new mongoose.Schema(
  {
    chatName: { type: String, trim: true },
    isGroupChat: { type: Boolean, default: false },
    isSystemGroup: { type: Boolean, default: false },
    semesterGroup: {
      type: Number,
      min: 1,
      max: 8,
      default: null,
    },
    users: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    latestMessage: { type: mongoose.Schema.Types.ObjectId, ref: "Message" },
    groupAdmin: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    groupAvatar: {
      type: String,
      default: "https://cdn-icons-png.flaticon.com/512/681/681494.png",
    },
  },
  { timestamps: true }
);

chatSchema.index(
  { semesterGroup: 1 },
  {
    unique: true,
    partialFilterExpression: {
      isSystemGroup: true,
      semesterGroup: { $type: "number" },
    },
  }
);

const Chat = mongoose.model("Chat", chatSchema);
export default Chat;
