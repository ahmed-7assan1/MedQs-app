export type SearchResult = {
  text: string;
  score: number;
  index: number;
};

function tokenize(text: string): string[] {
  return text.toLowerCase().split(/[\s\p{P}]+/u).filter(Boolean);
}

function bm25(
  queryTokens: string[],
  docTokens: string[],
  avgdl: number,
  N: number,
  df: Map<string, number>,
  k1 = 1.5,
  b = 0.75,
): number {
  const docLen = docTokens.length;
  let score = 0;
  for (const qt of queryTokens) {
    const tf = docTokens.filter((t) => t === qt).length;
    if (tf === 0) continue;
    const idf = Math.log((N - (df.get(qt) ?? 0) + 0.5) / ((df.get(qt) ?? 0) + 0.5) + 1);
    score += idf * ((tf * (k1 + 1)) / (tf + k1 * (1 - b + (b * docLen) / avgdl)));
  }
  return score;
}

export function searchLectureContent(
  query: string,
  paragraphs: string[],
  options?: { topK?: number; maxChars?: number },
): SearchResult[] {
  const topK = options?.topK ?? 2;
  const maxChars = options?.maxChars ?? 3000;

  if (!query.trim() || paragraphs.length === 0) return [];

  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) return [];

  const tokenizedDocs = paragraphs.map((p) => tokenize(p));
  const N = paragraphs.length;
  const avgdl = tokenizedDocs.reduce((s, t) => s + t.length, 0) / N;

  const df = new Map<string, number>();
  for (const doc of tokenizedDocs) {
    const seen = new Set(doc);
    for (const t of seen) {
      df.set(t, (df.get(t) ?? 0) + 1);
    }
  }

  const scored = paragraphs.map((text, i) => ({
    text,
    index: i,
    score: bm25(queryTokens, tokenizedDocs[i], avgdl, N, df),
  }));

  scored.sort((a, b) => b.score - a.score);

  const results: SearchResult[] = [];
  let totalChars = 0;
  for (const s of scored) {
    if (s.score === 0 && results.length > 0) break;
    if (totalChars + s.text.length > maxChars && results.length > 0) break;
    results.push(s);
    totalChars += s.text.length;
  }

  return results.length > 0 ? results : [{ text: paragraphs[0], score: 0, index: 0 }];
}
