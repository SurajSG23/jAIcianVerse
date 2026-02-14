import express from "express";
import chatController from "../controllers/chat.controller.js";
import protect from "../middleware/auth.middleware.js";

const router = express.Router();

router.route("/").post(protect, chatController.accessChat);
router.route("/").get(protect, chatController.fetchChats);
router.route("/group").post(protect, chatController.createGroupChat);
router.route("/group/rename").put(protect, chatController.renameGroup);
router.route("/group/add").put(protect, chatController.addToGroup);
router.route("/group/remove").put(protect, chatController.removeFromGroup);
router.route("/search-users").get(protect, chatController.searchUsers);

export default router;
