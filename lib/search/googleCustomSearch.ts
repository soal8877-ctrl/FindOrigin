import type { SearchHit } from "./types";

type GoogleSearchItem = {
  title?: string;
  link?: string;
  snippet?: string;
};

function parseGoogleErrorMessage(body: string): string | null {
  try {
    const json = JSON.parse(body) as {
      error?: { message?: string; status?: string };
    };
    const msg = json.error?.message?.trim();
    return msg ? msg.slice(0, 280) : null;
  } catch {
    return null;
  }
}

export function getGoogleSearchConfig(): { apiKey: string; cx: string } {
  const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
  const cx = process.env.GOOGLE_SEARCH_CX ?? process.env.GOOGLE_CSE_ID;
  if (!apiKey) {
    throw new Error("GOOGLE_SEARCH_API_KEY не задан");
  }
  if (!cx) {
    throw new Error("GOOGLE_SEARCH_CX не задан (ID Programmable Search Engine)");
  }
  return { apiKey, cx };
}

/** Google Custom Search JSON API (Programmable Search Engine). */
export async function searchGoogleCustom(query: string): Promise<SearchHit[]> {
  const { apiKey, cx } = getGoogleSearchConfig();

  const params = new URLSearchParams({
    key: apiKey,
    cx,
    q: query,
    num: "10",
    gl: "ru",
    lr: "lang_ru",
  });

  const url = `https://www.googleapis.com/customsearch/v1?${params.toString()}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(20000) });

  if (!res.ok) {
    const body = await res.text();
    console.error("Google Custom Search error", res.status, body.slice(0, 800));
    if (res.status === 429) {
      throw new Error("Исчерпана квота Google Search API (лимит запросов в день).");
    }
    const detail = parseGoogleErrorMessage(body);
    if (res.status === 403) {
      throw new Error(
        detail
          ? `Google Search: 403 — ${detail}`
          : "Google Search: 403 — проверьте ключ API, включён ли Custom Search API и ограничения ключа (Application restrictions: None для Vercel).",
      );
    }
    throw new Error(
      detail
        ? `Google Search (${res.status}): ${detail}`
        : `Google Search недоступен (${res.status})`,
    );
  }

  const data = (await res.json()) as { items?: GoogleSearchItem[] };
  const items = data.items ?? [];

  return items
    .filter((row) => row.link && row.title)
    .map((row) => ({
      url: row.link!,
      title: row.title!,
      snippet: row.snippet ?? "",
    }));
}
