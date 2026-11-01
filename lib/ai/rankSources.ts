import { getChatModel, getOpenAIClient, isAiConfigured } from "./client";
import type { SourceCandidate } from "@/lib/search/types";

export type RankedSource = {
  url: string;
  confidence: "высокая" | "средняя" | "низкая";
  reason: string;
};

export type RankSourcesResult = {
  sources: RankedSource[];
  note: string;
};

const EMPTY: RankSourcesResult = { sources: [], note: "" };

export async function rankSourcesWithAi(
  claimText: string,
  candidates: SourceCandidate[],
): Promise<RankSourcesResult> {
  const client = getOpenAIClient();
  if (!client || !isAiConfigured()) {
    throw new Error("OPENROUTER_API_KEY не задан — нужен для сравнения смысла");
  }

  if (candidates.length === 0) {
    return {
      sources: [],
      note: "В поиске не нашлось подходящих страниц.",
    };
  }

  const shortClaim =
    claimText.length > 4000 ? `${claimText.slice(0, 4000)}…` : claimText;

  const catalog = candidates.slice(0, 10).map((c, i) => ({
    id: i + 1,
    url: c.url,
    title: c.title,
    excerpt: c.excerpt.slice(0, 1200),
  }));

  const completion = await client.chat.completions.create({
    model: getChatModel(),
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "Ты помогаешь найти первоисточник информации. Сравнивай смысл утверждения и страниц, не буквальное совпадение. Отвечай только JSON на русском в полях reason и note.",
      },
      {
        role: "user",
        content: `Утверждение пользователя:\n"""${shortClaim}"""\n\nКандидаты:\n${JSON.stringify(catalog, null, 0)}\n\nВерни JSON:
{
  "sources": [ { "url": "...", "confidence": "высокая|средняя|низкая", "reason": "кратко" } ],
  "note": "общий комментарий одной фразой или пустая строка"
}
Правила: sources — от 0 до 3 элементов, только url из списка кандидатов; если совпадения слабые — меньше источников или пустой массив.`,
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) {
    return EMPTY;
  }

  try {
    const parsed = JSON.parse(raw) as {
      sources?: Array<{
        url?: string;
        confidence?: string;
        reason?: string;
      }>;
      note?: string;
    };
    const allowed = new Set(candidates.map((c) => c.url));
    const sources: RankedSource[] = [];

    for (const row of parsed.sources ?? []) {
      if (!row.url || !allowed.has(row.url)) continue;
      const conf = normalizeConfidence(row.confidence);
      sources.push({
        url: row.url,
        confidence: conf,
        reason: (row.reason ?? "").trim() || "Похоже по смыслу на исходное утверждение.",
      });
      if (sources.length >= 3) break;
    }

    return {
      sources,
      note: (parsed.note ?? "").trim(),
    };
  } catch {
    console.error("rankSourcesWithAi: invalid JSON");
    return EMPTY;
  }
}

function normalizeConfidence(value?: string): RankedSource["confidence"] {
  const v = (value ?? "").toLowerCase();
  if (v.includes("высок") || v.includes("high")) return "высокая";
  if (v.includes("низк") || v.includes("low")) return "низкая";
  return "средняя";
}
