import { fetchPageExcerpt } from "./fetchSnippet";
import { hostKey, shouldSkipUrl } from "./filters";
import { buildSearchQueries } from "./queries";
import { searchGoogleCustom } from "./googleCustomSearch";
import type { SourceCandidate } from "./types";

const MAX_CANDIDATES = 12;
const MAX_PER_HOST = 2;
const ENRICH_LIMIT = 8;

export async function collectSourceCandidates(
  text: string,
): Promise<SourceCandidate[]> {
  const queries = buildSearchQueries(text);
  const byUrl = new Map<string, SourceCandidate>();
  const hostCounts = new Map<string, number>();

  for (const query of queries) {
    const hits = await searchGoogleCustom(query);
    for (const hit of hits) {
      if (shouldSkipUrl(hit.url)) continue;
      if (byUrl.has(hit.url)) continue;

      const host = hostKey(hit.url);
      const count = hostCounts.get(host) ?? 0;
      if (count >= MAX_PER_HOST) continue;

      byUrl.set(hit.url, {
        ...hit,
        excerpt: hit.snippet,
      });
      hostCounts.set(host, count + 1);
      if (byUrl.size >= MAX_CANDIDATES) break;
    }
    if (byUrl.size >= MAX_CANDIDATES) break;
  }

  const list = [...byUrl.values()];
  const enrich = list.slice(0, ENRICH_LIMIT);
  await Promise.all(
    enrich.map(async (candidate) => {
      const pageText = await fetchPageExcerpt(candidate.url);
      if (pageText.length > candidate.excerpt.length) {
        candidate.excerpt = pageText;
      }
    }),
  );

  return list;
}
