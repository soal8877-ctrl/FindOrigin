import OpenAI from "openai";

let openRouterClient: OpenAI | null = null;
let openAiClient: OpenAI | null = null;

export function isAiConfigured(): boolean {
  return Boolean(process.env.OPENROUTER_API_KEY ?? process.env.OPENAI_API_KEY);
}

/** Модель для chat.completions: OpenRouter или прямой OpenAI. */
export function getChatModel(): string {
  if (process.env.OPENROUTER_API_KEY) {
    return process.env.OPENROUTER_MODEL ?? "openrouter/free";
  }
  return "gpt-4o-mini";
}

/**
 * OpenAI-совместимый клиент: приоритет у OpenRouter, иначе OpenAI.
 */
export function getOpenAIClient(): OpenAI | null {
  const openRouterKey = process.env.OPENROUTER_API_KEY;
  if (openRouterKey) {
    if (!openRouterClient) {
      openRouterClient = new OpenAI({
        apiKey: openRouterKey,
        baseURL: "https://openrouter.ai/api/v1",
        defaultHeaders: {
          "HTTP-Referer":
            process.env.OPENROUTER_SITE_URL ?? "http://localhost:3000",
          "X-Title": "FindOrigin",
        },
      });
    }
    return openRouterClient;
  }

  const openAiKey = process.env.OPENAI_API_KEY;
  if (!openAiKey) {
    return null;
  }
  if (!openAiClient) {
    openAiClient = new OpenAI({ apiKey: openAiKey });
  }
  return openAiClient;
}
