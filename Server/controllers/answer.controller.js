import Answer from "../models/answer.model.js";
import asyncHandler from "express-async-handler";

const getUserAnswers = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const totalAnswers = (await Answer.find({ answeredBy: userId })).length;

  res.status(200).json({
    message: "User announcements fetched successfully",
    totalAnswers,
  });
});

export default { getUserAnswers };
