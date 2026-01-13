import asyncHandler from "express-async-handler";
import imagekit from "../config/imagekit.config.js";
import Material from "../models/material.model.js";
import Subject from "../models/subject.model.js";
import Unit from "../models/unit.model.js";
import mongoose from "mongoose";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import { geminiModel } from "../aiConfig/config/gemini.config.js";
import { generateWithOpenRouter } from "../aiConfig/config/openrouter.config.ts";
import summaryPrompt from "../aiConfig/prompts/summary.prompt.js";
import mcqPrompt from "../aiConfig/prompts/mcq.prompt.js";
import Summary from "../models/unitSummary.model.js";
import axios from "axios";

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

const extractRandomParasFromPdf = async (pdfUrl, paraCount = 5) => {
  const response = await fetch(pdfUrl);
  const buffer = await response.arrayBuffer();

  const loadingTask = pdfjsLib.getDocument({ data: buffer });
  const pdf = await loadingTask.promise;

  let text = "";

  const pagesToRead = getRandomPages(
    pdf.numPages,
    Math.min(10, pdf.numPages) // read 5 random pages max
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

const storeCloudinary = async (text, subjectId, unitId) => {
  const textBlob = new Blob([text], { type: "text/plain" });
  const textFile = new File([textBlob], `summary-${Date.now()}.txt`, {
    type: "text/plain",
  });

  const formData = new FormData();
  formData.append("file", textFile);
  formData.append("upload_preset", process.env.CLOUD_PRESET_NAME);
  formData.append("cloud_name", process.env.CLOUD_NAME);

  const response = await axios.post(
    `https://api.cloudinary.com/v1_1/${process.env.CLOUD_NAME}/raw/upload`,
    formData
  );

  const fileUrl = response.data.secure_url;

  const summary = await Summary.create({
    fileUrl,
    subjectId,
    unitId,
  });
  return summary;
};

const generateSummary = asyncHandler(async (req, res) => {
  const { subjectId, unitId, selectedSubject } = req.query;
  const useGemini = false; // toggle here

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

  // Return existing summary if found
  const existingSummary = await Summary.findOne({ subjectId, unitId });

  if (existingSummary) {
    const response = await fetch(existingSummary.fileUrl);
    const summaryText = await response.text();

    return res.status(200).json({
      message: "Summary generated successfully",
      summary: summaryText,
    });
  }

  // Build context from materials
  const materials = await Material.find({
    subject: subjectId,
    unit: unitId,
  }).limit(4);

  let context = `SUBJECT: ${selectedSubject}\n\n`;

  for (const material of materials) {
    try {
      const paras = await extractRandomParasFromPdf(
        material.fileUrl,
        3
      );
      if (paras) {
        context += paras + "\n\n";
      }
    } catch (err) {
      console.error("PDF read failed:", material.fileUrl);
    }
  }

  if (!context.trim()) {
    throw new Error("No material content available");
  }

  // Generate summary
  const prompt = summaryPrompt(context);

  const summaryText = useGemini
    ? (await geminiModel.generateContent(prompt)).response?.text()
    : await generateWithOpenRouter([
        { role: "user", content: prompt },
      ]);

  // Store summary ONCE
  await storeCloudinary(summaryText, subjectId, unitId);

  // Send response
  res.status(200).json({
    message: "Summary generated successfully",
    summary: summaryText,
  });
});


const generateMCQ = asyncHandler(async (req, res) => {
  const { subjectId, unitId } = req.query;
  const useGemini = false; 

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

  // Get or create summary
  let summaryText;

  const existingSummary = await Summary.findOne({ subjectId, unitId });

  if (existingSummary) {
    const response = await fetch(existingSummary.fileUrl);
    summaryText = await response.text();
  } else {
    const materials = await Material.find({
      subject: subjectId,
      unit: unitId,
    }).limit(4);

    let context = "";

    for (const material of materials) {
      try {
        const paras = await extractRandomParasFromPdf(
          material.fileUrl,
          3
        );
        if (paras) {
          context += paras + "\n\n";
        }
      } catch (err) {
        console.error("PDF read failed:", material.fileUrl);
      }
    }

    if (!context) {
      throw new Error("No material content found");
    }

    const prompt = summaryPrompt(context);

    summaryText = useGemini
      ? (await geminiModel.generateContent(prompt)).response?.text()
      : await generateWithOpenRouter([
          { role: "user", content: prompt },
        ]);

    const storedSummary = await storeCloudinary(
      summaryText,
      subjectId,
      unitId
    );

    const response = await fetch(storedSummary.fileUrl);
    summaryText = await response.text();
  }

  // Generate MCQs from summary
  const mcqPromptText = mcqPrompt(summaryText);

  const mcqText = useGemini
    ? (await geminiModel.generateContent(mcqPromptText)).response?.text()
    : await generateWithOpenRouter([
        { role: "user", content: mcqPromptText },
      ]);

  // Return response
  res.status(200).json({
    message: "Questions generated successfully",
    questions: mcqText,
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
  generateMCQ,
};
