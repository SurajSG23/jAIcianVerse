import Discussion from "../models/discussion.model.js";
import asyncHandler from "express-async-handler";

const uploadDiscussion = asyncHandler(async (req, res) => {
    const userId = req.user._id
});

export default { uploadDiscussion };
