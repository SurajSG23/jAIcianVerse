import { OpenRouter } from "@openrouter/sdk";

const openRouterApiKey = process.env.OPEN_ROUTER_API_KEY;

if (!openRouterApiKey) {
  throw new Error("OPEN_ROUTER_API_KEY not found in .env");
}

const openRouter = new OpenRouter({
  apiKey: openRouterApiKey,
  defaultHeaders: {
    "HTTP-Referer": process.env.SITE_URL || "http://localhost:5173",
    "X-Title": process.env.SITE_NAME || "JaicianVerse",
  },
});

export const openRouterModel = {
  model: "deepseek/deepseek-r1-0528:free",
  temperature: 0.6,
  max_tokens: 300,
  top_p: 0.9,
};

export const generateWithOpenRouter = async (messages) => {
  const completion = await openRouter.chat.send({
    ...openRouterModel,
    messages,
    stream: false,
  });

  return completion.choices[0].message.content;
};

export default openRouter;
