import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    chat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
    },
    content: { type: String, trim: true },
    type: {
      type: String,
      enum: ["text", "image"],
      default: "text",
    },
    imageUrl: { type: String },
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    isEdited: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    replyTo: { type: mongoose.Schema.Types.ObjectId, ref: "Message" },
    forwardedFrom: { type: mongoose.Schema.Types.ObjectId, ref: "Message" },
  },
  { timestamps: true }
);

const Message = mongoose.model("Message", messageSchema);
export default Message;
