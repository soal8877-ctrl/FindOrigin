import { getOpenAIClient } from "./client";

export type AiEntitySlice = {
  claims: string[];
  names: string[];
  organizations: string[];
};

const EMPTY: AiEntitySlice = { claims: [], names: [], organizations: [] };

export async function extractClaimsWithAi(text: string): Promise<AiEntitySlice> {
  const openai = getOpenAIClient();
  if (!openai) {
    return EMPTY;
  }

  const snippet = text.length > 6000 ? `${text.slice(0, 6000)}…` : text;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "Ты выделяешь из текста новости структурированные данные для поиска первоисточника. Отвечай только JSON.",
      },
      {
        role: "user",
        content: `Текст:\n"""${snippet}"""\n\nВерни JSON с полями:
- claims: массив из 1–5 ключевых утверждений своими словами (кратко, на русском)
- names: имена людей
- organizations: организации, бренды, ведомства`,
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) {
    return EMPTY;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<AiEntitySlice>;
    return {
      claims: Array.isArray(parsed.claims)
        ? parsed.claims.filter((c): c is string => typeof c === "string").slice(0, 5)
        : [],
      names: Array.isArray(parsed.names)
        ? parsed.names.filter((c): c is string => typeof c === "string").slice(0, 15)
        : [],
      organizations: Array.isArray(parsed.organizations)
        ? parsed.organizations
            .filter((c): c is string => typeof c === "string")
            .slice(0, 15)
        : [],
    };
  } catch {
    console.error("extractClaimsWithAi: invalid JSON from model");
    return EMPTY;
  }
}
