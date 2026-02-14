import express from "express";
import messageController from "../controllers/message.controller.js";
import protect from "../middleware/auth.middleware.js";

const router = express.Router();

router.route("/").post(protect, messageController.sendMessage);
router.route("/:chatId").get(protect, messageController.getMessages);
router.route("/:chatId/search").get(protect, messageController.searchMessages);

export default router;
