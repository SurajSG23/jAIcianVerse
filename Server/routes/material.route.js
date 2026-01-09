import express from "express";
import materialController from "../controllers/material.controller.js";
import protect from "../middleware/auth.middleware.js";
import upload from "../middleware/multer.middleware.js"

const router = express.Router();

router.post("/upload-notes", protect, upload.single("file"), materialController.uploadNotes);
router.route("/fetchSubjectUnitID").get(materialController.fetchSubjectUnitID);
router.route("/getMaterials").get(materialController.getMaterials);

export default router;
