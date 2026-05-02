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

  const sortedDiscussions = discussions.map((discussion) => {
    const discussionObject = discussion.toObject();
    discussionObject.answers = (discussionObject.answers || []).sort((a, b) => {
      const upvoteDiff = (b.upvotes?.length || 0) - (a.upvotes?.length || 0);
      if (upvoteDiff !== 0) {
        return upvoteDiff;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    return discussionObject;
  });

  res.status(200).json({
    success: true,
    count: sortedDiscussions.length,
    discussions: sortedDiscussions,
  });
});
const fetchDiscussionByName = asyncHandler(async (req, res) => {
  const { subjectName, unitName } = req.query;

  const query = {};

  if (subjectName) {
    query.subject = subjectName;
  }

  if (unitName) {
    const unitMatch = String(unitName).match(/\b(\d+)\b/);
    if (unitMatch) {
      query.unit = Number(unitMatch[1]);
    }
  }

  const discussions = await Discussion.find(query)
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

  const sortedDiscussions = discussions.map((discussion) => {
    const discussionObject = discussion.toObject();
    discussionObject.answers = (discussionObject.answers || []).sort((a, b) => {
      const upvoteDiff = (b.upvotes?.length || 0) - (a.upvotes?.length || 0);
      if (upvoteDiff !== 0) {
        return upvoteDiff;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    return discussionObject;
  });
    
  res.status(200).json({
    success: true,
    count: sortedDiscussions.length,
    discussions: sortedDiscussions,
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

const fetchAnnouncementsById = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const announcements = await Announcement.find({ createdBy: userId })
    .populate("createdBy", "name role profileImage")
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
    "name profileImage role"
  );

  res.status(201).json({ answer: populatedAnswer });
});

const toggleAnswerUpvote = asyncHandler(async (req, res) => {
  const { answerId } = req.params;

  const answer = await Answer.findById(answerId);

  if (!answer) {
    res.status(404);
    throw new Error("Answer not found");
  }

  const userId = req.user._id.toString();
  const existingVoteIndex = answer.upvotes.findIndex(
    (id) => id.toString() === userId
  );

  let upvoted = false;

  if (existingVoteIndex >= 0) {
    answer.upvotes.splice(existingVoteIndex, 1);
  } else {
    answer.upvotes.push(req.user._id);
    upvoted = true;
  }

  await answer.save();

  res.status(200).json({
    success: true,
    upvoted,
    upvotes: answer.upvotes,
    upvoteCount: answer.upvotes.length,
  });
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
    designation: req.user.role, // or req.user.designation
    src: src || req.user.profileImage,
    createdBy: req.user._id,
  });

  res.status(201).json({
    success: true,
    message: "Announcement posted successfully",
    announcement,
  });
});

const deleteAnnouncements = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const announcement = await Announcement.findById(id);

  if (!announcement) {
    res.status(404);
    throw new Error("Announcement not found");
  }

  // Only creator can delete
  if (announcement.createdBy.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("You are not authorized to delete this announcement");
  }

  await announcement.deleteOne();

  res.status(200).json({
    success: true,
    message: "Announcement deleted successfully",
  });
});

export default {
  uploadDiscussion,
  fetchDiscussion,
  postAnswer,
  toggleAnswerUpvote,
  fetchAnnouncements,
  postAnnouncement,
  fetchAnnouncementsById,
  deleteAnnouncements,
  fetchDiscussionByName,
};
