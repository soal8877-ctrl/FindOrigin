export type SearchHit = {
  url: string;
  title: string;
  snippet: string;
};

export type SourceCandidate = SearchHit & {
  excerpt: string;
};
