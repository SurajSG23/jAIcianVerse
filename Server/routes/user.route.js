import express from "express";
import userController from "../controllers/user.controller.js";
// import protect from "../middleware/auth.middleware.js";

const router = express.Router();

router.route("/signUpStudent").post(userController.registerStudent);
router.route("/signUpProfessor").post(userController.registerProfessor);

export default router