import { extractClaimsWithAi } from "@/lib/ai/extractClaims";
import { extractRegexEntities } from "./regexEntities";

export type ExtractedEntities = {
  claims: string[];
  dates: string[];
  numbers: string[];
  names: string[];
  organizations: string[];
  links: string[];
  searchQuery: string;
  usedAi: boolean;
};

function buildSearchQuery(parts: {
  claims: string[];
  names: string[];
  organizations: string[];
  dates: string[];
}): string {
  const chunks: string[] = [];
  if (parts.claims.length > 0) {
    chunks.push(parts.claims.join(" "));
  }
  const entities = [...parts.names, ...parts.organizations, ...parts.dates];
  if (entities.length > 0) {
    chunks.push(entities.join(" "));
  }
  const query = chunks.join(" ").replace(/\s+/g, " ").trim();
  if (query.length > 500) {
    return query.slice(0, 497) + "…";
  }
  return query || parts.claims[0] || "";
}

export async function extractEntities(text: string): Promise<ExtractedEntities> {
  const regex = extractRegexEntities(text);
  const ai = await extractClaimsWithAi(text);
  const usedAi = Boolean(process.env.OPENAI_API_KEY);

  let claims = ai.claims;
  if (claims.length === 0) {
    const firstSentence = text.split(/(?<=[.!?])\s+/)[0]?.trim();
    if (firstSentence && firstSentence.length > 20) {
      claims = [firstSentence.slice(0, 300)];
    } else {
      claims = [text.slice(0, 300)];
    }
  }

  const searchQuery = buildSearchQuery({
    claims,
    names: ai.names,
    organizations: ai.organizations,
    dates: regex.dates,
  });

  return {
    claims,
    dates: regex.dates,
    numbers: regex.numbers,
    names: ai.names,
    organizations: ai.organizations,
    links: regex.links,
    searchQuery,
    usedAi,
  };
}

export function formatEntitiesForUser(
  normalizedSource: string,
  entities: ExtractedEntities,
): string {
  const lines: string[] = [
    "Разбор текста готов (поиск источников — следующий этап).",
    "",
    `Источник ввода: ${normalizedSource === "telegram_post" ? "пост Telegram" : "текст"}.`,
    "",
    "Ключевые утверждения:",
    ...entities.claims.map((c, i) => `${i + 1}. ${c}`),
  ];

  if (entities.dates.length > 0) {
    lines.push("", "Даты: " + entities.dates.join(", "));
  }
  if (entities.numbers.length > 0) {
    lines.push("Числа: " + entities.numbers.slice(0, 10).join(", "));
  }
  if (entities.names.length > 0) {
    lines.push("Имена: " + entities.names.join(", "));
  }
  if (entities.organizations.length > 0) {
    lines.push("Организации: " + entities.organizations.join(", "));
  }
  if (entities.links.length > 0) {
    lines.push("Ссылки в тексте: " + entities.links.slice(0, 5).join(", "));
  }

  lines.push(
    "",
    `Поисковый запрос: ${entities.searchQuery || "—"}`,
    entities.usedAi
      ? ""
      : "\n(Подсказка: задайте OPENAI_API_KEY для более точного разбора утверждений.)",
  );

  return lines.filter((l) => l !== undefined).join("\n").trim();
}
