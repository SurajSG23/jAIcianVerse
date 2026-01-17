import express from "express";
import userController from "../controllers/user.controller.js";
import protect from "../middleware/auth.middleware.js";

const router = express.Router();

router.route("/signup").post(userController.registerUser);
router.route("/login").post(userController.loginUser);
router.route("/getuser-details").get(protect, userController.fetchUserDetails);
router.route("/update-profile").put(protect, userController.updateProfile);
router.route("/increment-points").put(protect, userController.incrementPoint);
router.route("/call-ai-model").get(userController.callAIModel);

export default router;
