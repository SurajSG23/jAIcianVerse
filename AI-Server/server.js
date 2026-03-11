import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { generateText } from "./ollama.js";
import { retrieveContext } from "./rag.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.post("/generate", async (req, res) => {
  console.log("Called");
  try {
    const { prompt, systemPrompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    const response = await generateText(prompt, systemPrompt);
    res.json({ response });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/rag-generate", async (req, res) => {
  console.log("[RAG] Called");
  try {
    const { prompt, systemPrompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    const relevantChunks = retrieveContext(prompt);
    let augmentedSystem = systemPrompt || "";

    if (relevantChunks.length > 0) {
      const context = relevantChunks.join("\n\n");
      augmentedSystem += `\n\nRelevant university knowledge base context:\n---\n${context}\n---\nAnswer using the context above when applicable.`;
    }

    const response = await generateText(prompt, augmentedSystem);
    res.json({ response });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
