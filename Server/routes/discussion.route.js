import express from "express";
import discussionController from "../controllers/discussion.controller.js";
import protect from "../middleware/auth.middleware.js";

const router = express.Router();

router
  .route("/upload-discussion")
  .post(protect, discussionController.uploadDiscussion);
router.route("/fetch-discussion").get(discussionController.fetchDiscussion);

export default router;
