import { GoogleGenerativeAI } from "@google/generative-ai";
import { generateWithOpenRouter } from "./openrouter.config.ts";

const geminiApiKey = process.env.GEMINI_API_KEY;
if (!geminiApiKey) {
  throw new Error("GEMINI_API_KEY not found in .env");
}

const genAI = new GoogleGenerativeAI(geminiApiKey);

const isGeminiOverloadError = (error) => {
  const status =
    error?.status ?? error?.response?.status ?? error?.cause?.status ?? error?.code;
  const message = String(error?.message ?? error ?? "");

  return (
    Number(status) === 429 ||
    /overload|resource exhausted|rate limit|too many requests|quota exceeded/i.test(message)
  );
};

const generateWithGemini = async (prompt) => {
  const result = await geminiModel.generateContent(prompt);
  return result.response?.text() ?? "";
};

export const generateWithGeminiFallback = async (prompt) => {
  try {
    return await generateWithGemini(prompt);
  } catch (error) {
    if (!isGeminiOverloadError(error)) {
      throw error;
    }

    console.warn("[Gemini] Overloaded, falling back to OpenRouter.");
    return await generateWithOpenRouter([{ role: "user", content: prompt }]);
  }
};

export const geminiModel = genAI.getGenerativeModel({
  model: "gemini-2.5-flash-lite",
  geminiConfig: {
    temperature: 0.6, 
    maxOutputTokens: 300,
    topP: 0.9,
    topK: 40,
  },
});

export default genAI;
