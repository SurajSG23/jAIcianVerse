import asyncHandler from "express-async-handler";
import imagekit from "../config/imagekit.config.js";
import Material from "../models/material.model.js";
import Subject from "../models/subject.model.js";
import Unit from "../models/unit.model.js";
import mongoose from "mongoose";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import { geminiModel } from "../gemini/config/gemini.config.js";
import summaryPrompt from "../gemini/prompts/summary.prompt.js";

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

const getMaterials = asyncHandler(async (req, res) => {
  const { subjectId, unitId } = req.query;

  if (!subjectId || !unitId) {
    res.status(400);
    throw new Error("subjectId and unitId are required");
  }

  if (
    !mongoose.Types.ObjectId.isValid(subjectId) ||
    !mongoose.Types.ObjectId.isValid(unitId)
  ) {
    res.status(400);
    throw new Error("Invalid subjectId or unitId");
  }

  const materials = await Material.find({
    subject: subjectId,
    unit: unitId,
  })
    .populate("subject", "name")
    .populate("unit", "name")
    .populate("uploadedBy", "name")
    .sort({ createdAt: -1 });

  res.status(200).json({
    count: materials.length,
    data: materials,
  });
});
const pickRandom = (arr, count) => {
  return arr.sort(() => 0.5 - Math.random()).slice(0, count);
};

const getRandomPages = (totalPages, count) => {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  return pages.sort(() => 0.5 - Math.random()).slice(0, count);
};

const extractRandomParasFromPdf = async (pdfUrl, paraCount = 3) => {
  const response = await fetch(pdfUrl);
  const buffer = await response.arrayBuffer();

  const loadingTask = pdfjsLib.getDocument({ data: buffer });
  const pdf = await loadingTask.promise;

  let text = "";

  const pagesToRead = getRandomPages(
    pdf.numPages,
    Math.min(5, pdf.numPages) // read 5 random pages max
  );

  for (const pageNum of pagesToRead) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    text += content.items.map((item) => item.str).join(" ") + "\n\n";
  }

  const paragraphs = text
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s+/g, " ").trim())
    .filter((p) => p.length > 120);

  return pickRandom(paragraphs, paraCount).join("\n\n");
};

const generateSummary = asyncHandler(async (req, res) => {
  const { subjectId, unitId } = req.query;

  if (!subjectId || !unitId) {
    res.status(400);
    throw new Error("subjectId and unitId are required");
  }

  if (
    !mongoose.Types.ObjectId.isValid(subjectId) ||
    !mongoose.Types.ObjectId.isValid(unitId)
  ) {
    res.status(400);
    throw new Error("Invalid subjectId or unitId");
  }

  const materials = await Material.find({
    subject: subjectId,
    unit: unitId,
  }).limit(4); // READ ONLY 4 FILES

  let contextParas = [];

  for (const material of materials) {
    try {
      const context = await extractRandomParasFromPdf(
        material.fileUrl,
        3 // 3 paras per file
      );

      if (context) {
        contextParas.push({
          source: material.fileUrl,
          context,
        });
      }
    } catch (err) {
      console.error("PDF read failed:", material.fileUrl);
    }
  }

  // LOG FINAL CONTEXT
  console.log("🔹 SUMMARY 🔹");

  let context = "";

  contextParas.forEach((item, i) => {
    context += `Source ${i + 1}: \n${item.context}\n\n`;
  });

  try {
    const prompt = summaryPrompt(context);

    const result = await geminiModel.generateContent(prompt);
    const text = result.response?.text();

    // res.json({
    //   success: true,
    //   summary: text,
    // });
    console.log(text);
  } catch (error) {
    console.error("Gemini API error:", error.message);
    res.status(500).json({ error: "Failed to generate summary" });
  }
  res.status(200).json({
    message: "Context extracted successfully",
    filesRead: contextParas.length,
  });
});

export const getUserNotes = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const notes = await Material.find({ uploadedBy: userId })
    .populate("subject", "name")
    .populate("unit", "title")
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    notes,
  });
});

export default {
  uploadNotes,
  fetchSubjectUnitID,
  getMaterials,
  getUserNotes,
  generateSummary,
};
