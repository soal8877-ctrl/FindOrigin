const URL_RE =
  /\bhttps?:\/\/[^\s<>"')\]]+/gi;

const DATE_RE =
  /\b(?:\d{1,2}[./-]\d{1,2}[./-]\d{2,4}|\d{4}-\d{2}-\d{2}|(?:\d{1,2}\s+)?(?:январ[ья]|феврал[ья]|марта?|апрел[ья]|ма[йя]|июн[ья]|июл[ья]|августа?|сентябр[ья]|октябр[ья]|ноябр[ья]|декабр[ья])(?:\s+\d{4})?)\b/giu;

/** Числа с разделителями, проценты, суммы — без одиночных цифр в словах */
const NUMBER_RE =
  /\b\d{1,3}(?:[ \u00A0]\d{3})*(?:[.,]\d+)?\s*%|\b\d+(?:[.,]\d+)?\b/g;

function uniqueLimited(items: string[], max: number): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of items) {
    const key = item.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
    if (out.length >= max) break;
  }
  return out;
}

export function extractRegexEntities(text: string): {
  dates: string[];
  numbers: string[];
  links: string[];
} {
  const dates = uniqueLimited([...text.matchAll(DATE_RE)].map((m) => m[0]), 20);
  const links = uniqueLimited([...text.matchAll(URL_RE)].map((m) => m[0]), 30);
  const numbers = uniqueLimited(
    [...text.matchAll(NUMBER_RE)]
      .map((m) => m[0])
      .filter((n) => n.length >= 2 || n.includes("%")),
    30,
  );
  return { dates, numbers, links };
}
