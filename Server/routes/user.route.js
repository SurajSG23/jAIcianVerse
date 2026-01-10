import express from "express";
import userController from "../controllers/user.controller.js";
import protect from "../middleware/auth.middleware.js";

const router = express.Router();

router.route("/signup").post(userController.registerUser);
router.route("/login").post(userController.loginUser);
router.route("/update-profile").put(protect, userController.updateProfile);
router.route("/fetch-announcements").get(protect, userController.fetchAnnouncements);

export default router