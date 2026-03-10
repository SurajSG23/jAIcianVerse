import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const OLLAMA_URL = process.env.OLLAMA_URL;
const MODEL = process.env.OLLAMA_MODEL;

export async function generateText(prompt, systemPrompt = "") {
  console.log(prompt);

  const messages = [];
  if (systemPrompt) {
    messages.push({ role: "system", content: systemPrompt });
  }
  messages.push({ role: "user", content: prompt });

  const response = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      messages,
      stream: false,
      options: {
        num_predict: 150,
      },
    }),
  });

  const data = await response.json();
  return data.message?.content || "";
}
