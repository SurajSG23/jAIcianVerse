import express from "express";
import answerController from "../controllers/answer.controller.js";
import protect from "../middleware/auth.middleware.js";

const router = express.Router();

router
  .route("/getUserAnswers")
  .get(protect, answerController.getUserAnswers);

export default router;
