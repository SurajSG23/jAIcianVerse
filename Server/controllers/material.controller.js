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
import { generateWithLocalAI } from "../aiConfig/config/localAI.js";

const RAG_SERVICE_URL = process.env.RAG_SERVICE_URL || "http://localhost:5001";

const sanitizeFileName = (filename) => {
  return filename.replace(/[.#$[\]]/g, "_").replace(/\s+/g, "_");
};

const buildNoteKey = (subjectName, unitNumber) => {
  return subjectName.replace(/\s+/g, "_") + "_" + unitNumber;
};

function chunkText(text, maxChunkSize = 1500, minChunkSize = 40) {
  // PDF extracted text often has no paragraph breaks — split by sentences instead
  // First try paragraph splitting
  let paragraphs = text
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s+/g, " ").trim())
    .filter((p) => p.length > minChunkSize);

  // If paragraph splitting yields too few chunks (common with PDF extraction),
  // fall back to sentence-based splitting with overlap
  if (paragraphs.length <= 1 && text.trim().length > maxChunkSize) {
    const sentences = text.replace(/\s+/g, " ").trim().match(/[^.!?]+[.!?]+/g) || [];
    if (sentences.length === 0) {
      // No sentence boundaries — split by fixed size with overlap
      const words = text.replace(/\s+/g, " ").trim().split(" ");
      const chunks = [];
      const wordsPerChunk = 250;
      const overlap = 50;
      for (let i = 0; i < words.length; i += wordsPerChunk - overlap) {
        const chunk = words.slice(i, i + wordsPerChunk).join(" ").trim();
        if (chunk.length > minChunkSize) chunks.push(chunk);
      }
      return chunks;
    }

    // Group sentences into overlapping chunks
    const chunks = [];
    let current = "";
    let sentenceBuffer = [];

    for (const s of sentences) {
      const trimmed = s.trim();
      if (current.length + trimmed.length + 1 <= maxChunkSize) {
        current += (current ? " " : "") + trimmed;
        sentenceBuffer.push(trimmed);
      } else {
        if (current.length > minChunkSize) chunks.push(current);
        // Overlap: keep the last 3 sentences for context continuity
        const overlapSentences = sentenceBuffer.slice(-3);
        current = overlapSentences.join(" ") + " " + trimmed;
        sentenceBuffer = [...overlapSentences, trimmed];
      }
    }
    if (current.length > minChunkSize) chunks.push(current);
    return chunks;
  }

  const chunks = [];
  let current = "";

  for (const para of paragraphs) {
    if (current.length + para.length + 1 <= maxChunkSize) {
      current += (current ? "\n\n" : "") + para;
    } else {
      if (current) chunks.push(current);

      if (para.length > maxChunkSize) {
        const sentences = para.match(/[^.!?]+[.!?]+/g) || [para];
        let sentBuf = "";
        for (const s of sentences) {
          if (sentBuf.length + s.length + 1 <= maxChunkSize) {
            sentBuf += (sentBuf ? " " : "") + s.trim();
          } else {
            if (sentBuf) chunks.push(sentBuf);
            sentBuf = s.trim();
          }
        }
        current = sentBuf || "";
      } else {
        current = para;
      }
    }
  }
  if (current && current.length > minChunkSize) chunks.push(current);

  return chunks;
}

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

  // Fire-and-forget: extract text, chunk, and ingest into RAG
  const pdfBuffer = new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  (async () => {
    try {
      const subjectDoc = await Subject.findById(subject).select("name");
      const unitDoc = await Unit.findById(unit).select("unitNumber");
      if (!subjectDoc || !unitDoc) {
        console.error("[RAG] Subject or Unit not found for IDs:", subject, unit);
        return;
      }

      const noteKey = buildNoteKey(subjectDoc.name, unitDoc.unitNumber);
      console.log(`[RAG] Extracting text for noteKey: ${noteKey}`);

      const pdfDoc = await pdfjsLib.getDocument({ data: pdfBuffer }).promise;
      let text = "";
      for (let i = 1; i <= pdfDoc.numPages; i++) {
        const page = await pdfDoc.getPage(i);
        const content = await page.getTextContent();
        text +=
          content.items
            .map((item) => ("str" in item ? item.str : ""))
            .join(" ") + "\n\n";
      }

      if (!text || text.trim().length < 50) {
        console.warn(`[RAG] Extracted text too short (${text.trim().length} chars) for ${noteKey}`);
        return;
      }

      const chunks = chunkText(text);
      if (chunks.length === 0) {
        console.warn(`[RAG] No chunks generated for ${noteKey}`);
        return;
      }

      console.log(`[RAG] Sending ${chunks.length} chunks to ingest for ${noteKey}`);

      const ingestRes = await fetch(`${RAG_SERVICE_URL}/ingest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ noteKey, chunks }),
        signal: AbortSignal.timeout(30000),
      });

      if (!ingestRes.ok) {
        const errBody = await ingestRes.text();
        console.error(`[RAG] Ingest returned ${ingestRes.status}: ${errBody}`);
        return;
      }

      const result = await ingestRes.json();
      console.log(`[RAG] Ingested ${result.chunksAdded} chunks for ${noteKey} (total: ${result.totalChunks})`);
    } catch (err) {
      console.error("[RAG] Ingestion failed:", err.message || err);
    }
  })();
});

const fetchSubjectUnitID = asyncHandler(async (req, res) => {
  const { subjectName, unitName } = req.query;

  if (!subjectName || !unitName) {
    res.status(400);
    throw new Error("subjectName and unitName are required");
  }

  const normalizedSubjectName = String(subjectName)
    .replace(/\s\[[^\]]+\]$/, "")
    .trim();

  const subject = await Subject.findOne({ name: normalizedSubjectName });

  if (!subject) {
    res.status(404);
    throw new Error("Subject not found");
  }

  const unitNumberMatch = String(unitName).match(/\d+/);
  const unitNumber = unitNumberMatch ? Number(unitNumberMatch[0]) : NaN;

  if (!Number.isFinite(unitNumber)) {
    res.status(400);
    throw new Error("Invalid unit name format");
  }

  const unit = await Unit.findOne({
    unitNumber,
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
    .populate("uploadedBy", "name role")
    .sort({ createdAt: -1 });

  const sortedMaterials = [...materials].sort((a, b) => {
    const upvoteDiff = (b.upvotes?.length || 0) - (a.upvotes?.length || 0);
    if (upvoteDiff !== 0) {
      return upvoteDiff;
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  res.status(200).json({
    count: sortedMaterials.length,
    data: sortedMaterials,
  });
});

const toggleMaterialUpvote = asyncHandler(async (req, res) => {
  const { materialId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(materialId)) {
    res.status(400);
    throw new Error("Invalid material ID");
  }

  const material = await Material.findById(materialId);

  if (!material) {
    res.status(404);
    throw new Error("Material not found");
  }

  const userId = req.user._id.toString();
  const existingVoteIndex = material.upvotes.findIndex(
    (id) => id.toString() === userId
  );

  let upvoted = false;

  if (existingVoteIndex >= 0) {
    material.upvotes.splice(existingVoteIndex, 1);
  } else {
    material.upvotes.push(req.user._id);
    upvoted = true;
  }

  await material.save();

  res.status(200).json({
    success: true,
    upvoted,
    upvotes: material.upvotes,
    upvoteCount: material.upvotes.length,
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

  await Summary.create({
    fileUrl,
    subjectId,
    unitId,
  });
};
const generateSummary = asyncHandler(async (req, res) => {
  const { subjectId, unitId, selectedSubject } = req.query;

  const useGemini = true;
  const useLocalModel = false;

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

  // Return cached summary if exists
  const existingSummary = await Summary.findOne({ subjectId, unitId });

  if (existingSummary) {
    const response = await fetch(existingSummary.fileUrl);
    const summaryText = await response.text();

    return res.status(200).json({
      message: "Summary generated successfully",
      summary: summaryText,
    });
  }

  // Build context
  const materials = await Material.find({
    subject: subjectId,
    unit: unitId,
  }).limit(4);

  if (materials.length === 0) {
    return res.status(404).json({
      message: "No materials found for the given subject and unit",
    });
  }

  let context = `SUBJECT: ${selectedSubject}\n\n`;

  for (const material of materials) {
    try {
      const paras = await extractRandomParasFromPdf(material.fileUrl, 3);
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

  // Prompt
  const prompt = summaryPrompt(context);

  let summaryText;

  if (useLocalModel) {
    summaryText = await generateWithLocalAI(prompt);
  } else {
    summaryText = useGemini
      ? (await geminiModel.generateContent(prompt)).response?.text()
      : await generateWithOpenRouter([{ role: "user", content: prompt }]);
  }

  res.status(200).json({
    message: "Summary generated successfully",
    summary: summaryText,
  });

  // Store once
  await storeCloudinary(summaryText, subjectId, unitId);
});

const generateMCQ = asyncHandler(async (req, res) => {
  const { subjectId, unitId } = req.query;

  const useLocalModel = false;
  const useGemini = true;

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

  let summaryText = "";

  const existingSummary = await Summary.findOne({ subjectId, unitId });

  if (existingSummary) {
    const response = await fetch(existingSummary.fileUrl);
    summaryText = await response.text();
  } else {
    const materials = await Material.find({
      subject: subjectId,
      unit: unitId,
    }).limit(4);

    if (materials.length === 0) {
      return res.status(404).json({
        message: "No materials found for the given subject and unit",
      });
    }

    let context = "";

    for (const material of materials) {
      try {
        const paras = await extractRandomParasFromPdf(material.fileUrl, 3);
        if (paras) {
          context += paras + "\n\n";
        }
      } catch (err) {
        console.error("PDF read failed:", material.fileUrl);
      }
    }

    if (!context.trim()) {
      throw new Error("No material content found");
    }

    const summaryGenPrompt = summaryPrompt(context);

    if (useLocalModel) {
      summaryText = await generateWithLocalAI(summaryGenPrompt);
    } else {
      summaryText = useGemini
        ? (await geminiModel.generateContent(summaryGenPrompt)).response?.text()
        : await generateWithOpenRouter([
            { role: "user", content: summaryGenPrompt },
          ]);
    }

    await storeCloudinary(summaryText, subjectId, unitId);
  }

  const mcqPromptText = mcqPrompt(summaryText);

  let mcqText;

  if (useLocalModel) {
    mcqText = await generateWithLocalAI(mcqPromptText);
  } else {
    mcqText = useGemini
      ? (await geminiModel.generateContent(mcqPromptText)).response?.text()
      : await generateWithOpenRouter([
          { role: "user", content: mcqPromptText },
        ]);
  }

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
  toggleMaterialUpvote,
  getUserNotes,
  generateSummary,
  generateMCQ,
};
