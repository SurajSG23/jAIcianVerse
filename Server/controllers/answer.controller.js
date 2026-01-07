import Answer from "../models/answer.model.js";
import asyncHandler from "express-async-handler";

const fetchDiscussion = asyncHandler(async (req, res) => {
  const discussions = await Answer.find()
    .sort({ createdAt: -1 }) // newest first
    .limit(20)
    .populate("postedBy", "name email profileImage role")
    .populate("answers");
  
  res.status(200).json({
    success: true,
    count: discussions.length,
    discussions,
  });
});

export default { fetchDiscussion };
