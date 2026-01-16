import express from "express";
import discussionController from "../controllers/discussion.controller.js";
import protect from "../middleware/auth.middleware.js";

const router = express.Router();

router
  .route("/upload-discussion")
  .post(protect, discussionController.uploadDiscussion);

router.route("/fetch-discussion").get(discussionController.fetchDiscussion);
router.route("/fetch-discussions-by-name").get(discussionController.fetchDiscussionByName);
router
  .route("/fetch-announcements")
  .get(discussionController.fetchAnnouncements);

router
  .route("/fetch-announcements-byId")
  .get(protect, discussionController.fetchAnnouncementsById);

router.route("/answers").post(protect, discussionController.postAnswer);

router
  .route("/announcements")
  .post(protect, discussionController.postAnnouncement);

router
  .route("/deleteAnnouncement/:id")
  .delete(protect, discussionController.deleteAnnouncements);

export default router;
