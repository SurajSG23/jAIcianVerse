import asyncHandler from "express-async-handler";
import imagekit from "../config/imagekit.config.js";
import Material from "../models/material.model.js";
import Subject from "../models/subject.model.js";

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

  const { originalname, buffer } = req.file;
  const sanitizedFileName = sanitizeFileName(originalname);

  try {
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
      data: {
        id: material._id,
        title: material.title,
        fileUrl: material.fileUrl,
        subject: material.subject,
        unit: material.unit,
        approved: material.approved,
        uploadedBy: material.uploadedBy,
        createdAt: material.createdAt,
      },
    });
  } catch (error) {
    console.error("Error uploading notes:", error);
    res.status(500);
    throw new Error("Error uploading PDF");
  }
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

  const unit = subject.units.find((u) => u.name === unitName);

  if (!unit) {
    res.status(404);
    throw new Error("Unit not found");
  }

  res.status(200).json({
    subjectId: subject._id,
    unitId: unit._id,
  });
});

export default { uploadNotes, fetchSubjectUnitID };
