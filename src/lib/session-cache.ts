export type PdfCacheEntry = {
  paragraphs: string[];
  lectureId: string;
  userId: string;
  lastAccessed: number;
};

export const pdfTextCache = new Map<string, PdfCacheEntry>();
export const PDF_CACHE_TTL = 30 * 60 * 1000;
export const MAX_CACHE_SIZE = 100;

export const telemetry = {
  pdfCacheHit: 0,
  pdfDownloaded: 0,
  pdfCacheCleared: 0,
  classifierUsed: 0,
  retrievalSource: { summaryOnly: 0, notesUsed: 0, pdfUsed: 0 } as Record<string, number>,
  totalRequests: 0,
};

export function buildCacheKey(userId: string, id: string): string {
  return `${userId}:${id}`;
}

// Periodic cleanup — only pdfTextCache now
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of pdfTextCache) {
    if (now - entry.lastAccessed > PDF_CACHE_TTL) {
      pdfTextCache.delete(key);
      telemetry.pdfCacheCleared++;
    }
  }
  if (pdfTextCache.size > MAX_CACHE_SIZE) {
    const sorted = [...pdfTextCache.entries()].sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);
    for (let i = 0; i < sorted.length - MAX_CACHE_SIZE; i++) {
      pdfTextCache.delete(sorted[i][0]);
    }
  }
}, 5 * 60 * 1000);
