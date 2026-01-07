import express from "express";
import discussionController from "../controllers/discussion.controller.js";
import protect from "../middleware/auth.middleware.js";

const router = express.Router();

router
  .route("/upload-discussion")
  .post(protect, discussionController.uploadDiscussion);

router.route("/fetch-discussion").get(discussionController.fetchDiscussion);
router.route("/fetch-announcements").get(discussionController.fetchAnnouncements);

router
  .route("/answers")
  .post(protect, discussionController.postAnswer);

export default router;
