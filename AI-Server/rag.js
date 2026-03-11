import fetch from "node-fetch";

const RAG_SERVICE_URL = process.env.RAG_SERVICE_URL || "http://localhost:5001";

// Calls the Python semantic search server (RAG-BOT/app.py)
// Falls back to empty array if the service is unavailable.
export async function retrieveContext(query, topK = 4) {
  try {
    const response = await fetch(`${RAG_SERVICE_URL}/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, topK }),
      signal: AbortSignal.timeout(5000),
    });
 
    if (!response.ok) return [];
    const data = await response.json();
    return data.chunks || [];
  } catch {
    console.warn("[RAG] Semantic search service unavailable, falling back to no context.");
    return [];
  }
}
