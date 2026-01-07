import Discussion from "../models/discussion.model.js";
import asyncHandler from "express-async-handler";

const uploadDiscussion = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const { question, subject, unit, imageURL, tags } = req.body;

  // Basic validation
  if (!question || !subject) {
    res.status(400);
    throw new Error("Question and subject are required");
  }

  // Create discussion
  const discussion = await Discussion.create({
    question,
    subject,
    unit,
    imageURL,
    tags,
    postedBy: userId,
  });

  res.status(201).json({
    success: true,
    message: "Discussion posted successfully",
    discussion,
  });
});

export default { uploadDiscussion };
