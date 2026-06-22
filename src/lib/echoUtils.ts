function normalize(text: string): string {
  return text.toLowerCase().replace(/[^\w\s]/g, "").replace(/\s+/g, " ").trim();
}

export function textSimilarity(a: string, b: string): number {
  const wordsA = new Set(normalize(a).split(" ").filter(Boolean));
  const wordsB = new Set(normalize(b).split(" ").filter(Boolean));

  if (wordsA.size === 0 && wordsB.size === 0) return 1;
  if (wordsA.size === 0 || wordsB.size === 0) return 0;

  let intersection = 0;
  for (const w of wordsA) {
    if (wordsB.has(w)) intersection++;
  }

  const union = wordsA.size + wordsB.size - intersection;
  return intersection / union;
}
