import { cacheGet, cacheSet, cacheDel } from "@/lib/redis";

export type PdfCacheEntry = {
  paragraphs: string[];
  lectureId: string;
  userId: string;
};

export const PDF_CACHE_TTL_SECONDS = 1800; // 30 minutes
const CACHE_PREFIX = "pdf:";

export const telemetry = {
  pdfCacheHit: 0,
  pdfDownloaded: 0,
  pdfCacheCleared: 0,
  classifierUsed: 0,
  retrievalSource: { summaryOnly: 0, notesUsed: 0, pdfUsed: 0 } as Record<string, number>,
  totalRequests: 0,
};

export function buildCacheKey(userId: string, id: string): string {
  return `${CACHE_PREFIX}${userId}:${id}`;
}

export async function getCachedPdfText(cacheKey: string): Promise<PdfCacheEntry | null> {
  const raw = await cacheGet(cacheKey);
  if (!raw) return null;
  telemetry.pdfCacheHit++;
  return JSON.parse(raw) as PdfCacheEntry;
}

export async function setCachedPdfText(cacheKey: string, entry: PdfCacheEntry): Promise<void> {
  await cacheSet(cacheKey, JSON.stringify(entry), PDF_CACHE_TTL_SECONDS);
}

export async function clearCachedPdfText(cacheKey: string): Promise<void> {
  await cacheDel(cacheKey);
  telemetry.pdfCacheCleared++;
}
