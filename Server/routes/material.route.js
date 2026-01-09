import express from "express";
import materialController from "../controllers/material.controller.js";
import protect from "../middleware/auth.middleware.js";

const router = express.Router();

router.route("/upload-notes").post(protect, materialController.uploadNotes);
router.route("/fetchSubjectUnitID").get(materialController.fetchSubjectUnitID);

export default router;
