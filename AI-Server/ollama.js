import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const OLLAMA_URL = process.env.OLLAMA_URL;
const MODEL = process.env.OLLAMA_MODEL;

export async function generateText(prompt) {
  console.log(prompt);

  const response = await fetch(`${OLLAMA_URL}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      prompt,
      stream: false,
    }),
  });

  const data = await response.json();
  return data.response;
}
