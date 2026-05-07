/**
 * site-cache.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * In-memory cache for site-wide data used by the AI bot.
 * Avoids repeated DB calls on every chat request.
 *
 * Lifetime: 1 hour TTL or manual invalidation via syncSiteCache().
 * Storage: globalThis (survives Next.js hot-reload in dev; per-instance in prod).
 */

import { prisma } from "./prisma";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CachedForum {
  id: string;
  name: string;
  type: string;
  status: string;
  universityId: string;
  semesterId: string | null;
}

export interface CachedSubject {
  id: string;
  name: string;
  moduleName: string | null;
  semesterName: string | null;
}

export interface CachedSiteData {
  /** Epoch ms of last sync */
  syncedAt: number;
  siteConfig: {
    siteName: string;
    enableAI: boolean;
    enableForum: boolean;
    enableAds: boolean;
    enableNotifs: boolean;
    enableLeaderboard: boolean;
    aiPreferredProvider: string;
    primaryColor: string;
  } | null;
  universities: { id: string; name: string }[];
  forums: CachedForum[];
  subjects: CachedSubject[];
  totalUsers: number;
  totalQuestions: number;
  totalLectures: number;
}

// ─── Global store ─────────────────────────────────────────────────────────────

const g = globalThis as unknown as { __siteCache?: CachedSiteData };

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

function isCacheStale(): boolean {
  if (!g.__siteCache) return true;
  return Date.now() - g.__siteCache.syncedAt > CACHE_TTL_MS;
}

// ─── Core sync ────────────────────────────────────────────────────────────────

export async function syncSiteCache(): Promise<CachedSiteData> {
  const [siteConfig, universities, forums, subjects, totalUsers, totalQuestions, totalLectures] =
    await Promise.all([
      prisma.siteConfig.findFirst({
        select: {
          siteName: true,
          enableAI: true,
          enableForum: true,
          enableAds: true,
          enableNotifs: true,
          enableLeaderboard: true,
          aiPreferredProvider: true,
          primaryColor: true,
        },
      }),
      prisma.university.findMany({ select: { id: true, name: true } }),
      prisma.forum.findMany({
        select: {
          id: true,
          name: true,
          type: true,
          status: true,
          universityId: true,
          semesterId: true,
        },
        orderBy: { createdAt: "asc" },
      }),
      prisma.subject.findMany({
        select: {
          id: true,
          name: true,
          module: { select: { name: true } },
          semester: { select: { name: true } },
        },
      }),
      prisma.user.count(),
      prisma.question.count(),
      prisma.lecture.count(),
    ]);

  const data: CachedSiteData = {
    syncedAt: Date.now(),
    siteConfig: siteConfig ?? null,
    universities,
    forums: forums.map((f) => ({
      id: f.id,
      name: f.name,
      type: f.type,
      status: f.status,
      universityId: f.universityId,
      semesterId: f.semesterId,
    })),
    subjects: subjects.map((s) => ({
      id: s.id,
      name: s.name,
      moduleName: (s as any).module?.name ?? null,
      semesterName: (s as any).semester?.name ?? null,
    })),
    totalUsers,
    totalQuestions,
    totalLectures,
  };

  g.__siteCache = data;
  console.log(
    `[site-cache] Synced — ${forums.length} forums, ${subjects.length} subjects, ${totalUsers} users`
  );
  return data;
}

// ─── Public accessor ──────────────────────────────────────────────────────────

/**
 * Returns cached site data. Auto-syncs if cache is empty or older than 1 hour.
 */
export async function getCachedSiteData(): Promise<CachedSiteData> {
  if (isCacheStale()) {
    return syncSiteCache();
  }
  return g.__siteCache!;
}

/**
 * Returns the cached data synchronously WITHOUT triggering a refresh.
 * Returns null if cache hasn't been populated yet.
 */
export function getCachedSiteDataSync(): CachedSiteData | null {
  return g.__siteCache ?? null;
}

/** Invalidate the cache so the next call to getCachedSiteData() re-fetches. */
export function invalidateSiteCache(): void {
  if (g.__siteCache) {
    g.__siteCache.syncedAt = 0;
  }
}

/** Human-readable summary of cache state for the bot */
export function cacheSummaryText(data: CachedSiteData): string {
  const age = Math.round((Date.now() - data.syncedAt) / 1000);
  const ageLabel = age < 60 ? `${age}s ago` : `${Math.round(age / 60)}m ago`;
  const lines = [
    `📊 **Site Cache Summary** (synced ${ageLabel})`,
    `🏛️ Universities: ${data.universities.map((u) => u.name).join(", ") || "none"}`,
    `💬 Forums: ${data.forums.length} total (${data.forums.filter((f) => f.status === "OPEN").length} open)`,
    `📚 Subjects: ${data.subjects.length}`,
    `👥 Users: ${data.totalUsers} | ❓ Questions: ${data.totalQuestions} | 📖 Lectures: ${data.totalLectures}`,
  ];
  if (data.siteConfig) {
    lines.push(
      `⚙️ AI: ${data.siteConfig.enableAI ? "✅ ON" : "❌ OFF"} | Provider: ${data.siteConfig.aiPreferredProvider}`
    );
  }
  return lines.join("\n");
}
