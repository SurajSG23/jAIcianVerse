import fetch from "node-fetch";

export const generateWithLocalAI = async (prompt) => {
  const response = await fetch("http://localhost:5000/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ prompt })
  });

  if (!response.ok) {
    throw new Error("Local AI server failed");
  }

  const data = await response.json();
  return data.response;
};
