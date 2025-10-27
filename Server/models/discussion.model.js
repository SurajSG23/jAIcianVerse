import mongoose from "mongoose";

const discussionSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    semester: { type: Number },
    subject: { type: String, required: true },
    unit: { type: Number },
    postedAt: { type: Date, default: Date.now },
    tags: [{ type: String }],
    views: { type: Number, default: 0 },
    answers: [{ type: mongoose.Schema.Types.ObjectId, ref: "Answer" }],
  },
  { timestamps: true }
);

const Discussion = mongoose.model("Discussion", discussionSchema);
export default Discussion;
