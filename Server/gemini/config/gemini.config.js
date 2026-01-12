import { GoogleGenerativeAI } from "@google/generative-ai";

const geminiApiKey = process.env.GEMINI_API_KEY;
if (!geminiApiKey) {
  throw new Error("GEMINI_API_KEY not found in .env");
}

const genAI = new GoogleGenerativeAI(geminiApiKey);

export const geminiModel = genAI.getGenerativeModel({
  model: "gemini-2.5-flash", 
  geminiConfig: {
    temperature: 0.7, 
    maxOutputTokens: 300, 
  },
});

export default genAI;
