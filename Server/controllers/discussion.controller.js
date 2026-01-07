import Announcement from "../models/announcements.model.js";
import Answer from "../models/answer.model.js";
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

const fetchDiscussion = asyncHandler(async (req, res) => {
  const discussions = await Discussion.find()
    .sort({ createdAt: -1 })
    .limit(20)
    .populate("postedBy", "name email profileImage role")
    .populate({
      path: "answers",
      populate: {
        path: "answeredBy",
        select: "name email profileImage role",
      },
    });

  res.status(200).json({
    success: true,
    count: discussions.length,
    discussions,
  });
});

const fetchAnnouncements = asyncHandler(async (req, res) => {
  const announcements = await Announcement.find()
    .sort({ createdAt: -1 })
    .limit(10);

  res.status(200).json({
    success: true,
    count: announcements.length,
    announcements,
  });
});

const postAnswer = asyncHandler(async (req, res) => {
  const { text, discussionId } = req.body;

  const answer = await Answer.create({
    text,
    answeredTo: discussionId,
    answeredBy: req.user._id,
  });

  await Discussion.findByIdAndUpdate(discussionId, {
    $push: { answers: answer._id },
  });

  const populatedAnswer = await answer.populate(
    "answeredBy",
    "name profileImage"
  );

  res.status(201).json({ answer: populatedAnswer });
});

const postAnnouncement = asyncHandler(async (req, res) => {
  const { quote, src } = req.body;

  if (!quote) {
    res.status(400);
    throw new Error("Announcement text is required");
  }

  const announcement = await Announcement.create({
    quote,
    name: req.user.name,
    designation: req.user.role, // or req.user.designation if you have one
    src: src || req.user.profileImage,
  });

  res.status(201).json({
    message: "Announcement posted successfully",
    announcement,
  });
});

export default {
  uploadDiscussion,
  fetchDiscussion,
  postAnswer,
  fetchAnnouncements,
  postAnnouncement,
};
