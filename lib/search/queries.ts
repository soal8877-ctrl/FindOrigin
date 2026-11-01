import { extractRegexEntities } from "@/lib/extract/regexEntities";

function coreText(text: string, maxLen: number): string {
  const compact = text.replace(/\s+/g, " ").trim();
  if (compact.length <= maxLen) {
    return compact;
  }
  return compact.slice(0, maxLen).trim();
}

/** 2–4 запроса для веб-поиска без предварительного AI-разбора. */
export function buildSearchQueries(text: string): string[] {
  const core = coreText(text, 280);
  const { dates } = extractRegexEntities(text);
  const dateBit = dates[0] ? ` ${dates[0]}` : "";

  const variants = [
    `${core}${dateBit}`,
    `${core} новости`,
    `${core} официальный источник`,
    `${core} исследование данные`,
  ];

  const seen = new Set<string>();
  const out: string[] = [];
  for (const q of variants) {
    const key = q.toLowerCase();
    if (q.length < 12 || seen.has(key)) continue;
    seen.add(key);
    out.push(q);
  }
  return out.slice(0, 4);
}
