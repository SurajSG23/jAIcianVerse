import asyncHandler from "express-async-handler";
import imagekit from "../config/imagekit.config.js";
import Material from "../models/material.model.js";
import Subject from "../models/subject.model.js";
import Unit from "../models/unit.model.js";
import mongoose from "mongoose";

const sanitizeFileName = (filename) => {
  return filename.replace(/[.#$[\]]/g, "_").replace(/\s+/g, "_");
};

const uploadNotes = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error("No PDF file uploaded");
  }

  const { title, subject, unit } = req.body;

  if (!title || !subject || !unit) {
    res.status(400);
    throw new Error("Title, subject and unit are required");
  }

  if (
    !mongoose.Types.ObjectId.isValid(subject) ||
    !mongoose.Types.ObjectId.isValid(unit)
  ) {
    res.status(400);
    throw new Error("Invalid subject or unit ID");
  }

  const { originalname, buffer } = req.file;
  const sanitizedFileName = sanitizeFileName(originalname);

  const uploadResponse = await imagekit.upload({
    file: buffer,
    fileName: sanitizedFileName,
    folder: "/JaicianVersePDF/",
    isPrivateFile: false,
  });

  const material = await Material.create({
    title,
    fileUrl: uploadResponse.url,
    uploadedBy: req.user._id,
    subject,
    unit,
    approved: false,
  });

  res.status(201).json({
    message: "Notes uploaded successfully",
    data: material,
  });
});

const fetchSubjectUnitID = asyncHandler(async (req, res) => {
  const { subjectName, unitName } = req.query;

  if (!subjectName || !unitName) {
    res.status(400);
    throw new Error("subjectName and unitName are required");
  }

  const subject = await Subject.findOne({ name: subjectName });

  if (!subject) {
    res.status(404);
    throw new Error("Subject not found");
  }

  const unit = await Unit.findOne({
    unitNumber: Number(unitName.split(" ")[1]),
    subject: subject._id,
  });

  if (!unit) {
    res.status(404);
    throw new Error("Unit not found for this subject");
  }

  res.status(200).json({
    subjectId: subject._id,
    unitId: unit._id,
  });
});

export default { uploadNotes, fetchSubjectUnitID };
