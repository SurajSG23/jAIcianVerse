import { GoogleGenerativeAI } from "@google/generative-ai";

const geminiApiKey = process.env.GEMINI_API_KEY;
if (!geminiApiKey) {
  throw new Error("GEMINI_API_KEY not found in .env");
}

const genAI = new GoogleGenerativeAI(geminiApiKey);

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
