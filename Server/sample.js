import fetch from "node-fetch";

const AI_SERVER_URL = "http://localhost:5000/generate";

const generateSummary = async () => {
  try {
    const response = await fetch(AI_SERVER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: "Who is monkey d luffy?",
      }),
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const data = await response.json();
    console.log("AI Response:", data.response);

    return data.response;
  } catch (error) {
    console.error("Error calling AI server:", error.message);
  }
};

console.log(generateSummary());
