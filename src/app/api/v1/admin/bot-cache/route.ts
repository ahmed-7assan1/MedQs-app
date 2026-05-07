import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { syncSiteCache, getCachedSiteData, cacheSummaryText, invalidateSiteCache } from "@/lib/site-cache";

/**
 * GET  /api/v1/admin/bot-cache  → returns current cache status
 * POST /api/v1/admin/bot-cache  → forces a full cache refresh from DB
 * DELETE /api/v1/admin/bot-cache → invalidates (marks stale) without refetching
 */

async function requireAdmin(req: NextRequest) {
  const session = await auth();
  const role = (session?.user as any)?.role as string | undefined;
  if (!session?.user?.id || (role !== "ADMIN" && role !== "SUPER_ADMIN")) {
    return { ok: false as const, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { ok: true as const };
}

export async function GET(req: NextRequest) {
  const check = await requireAdmin(req);
  if (!check.ok) return check.response;

  const data = await getCachedSiteData();
  return NextResponse.json({
    syncedAt: new Date(data.syncedAt).toISOString(),
    ageSeconds: Math.round((Date.now() - data.syncedAt) / 1000),
    summary: cacheSummaryText(data),
    universities: data.universities.length,
    forums: data.forums.length,
    subjects: data.subjects.length,
    totalUsers: data.totalUsers,
    totalQuestions: data.totalQuestions,
    totalLectures: data.totalLectures,
  });
}

export async function POST(req: NextRequest) {
  const check = await requireAdmin(req);
  if (!check.ok) return check.response;

  const start = Date.now();
  const data = await syncSiteCache();
  const ms = Date.now() - start;

  return NextResponse.json({
    success: true,
    syncedAt: new Date(data.syncedAt).toISOString(),
    durationMs: ms,
    summary: cacheSummaryText(data),
    counts: {
      universities: data.universities.length,
      forums: data.forums.length,
      subjects: data.subjects.length,
      totalUsers: data.totalUsers,
      totalQuestions: data.totalQuestions,
      totalLectures: data.totalLectures,
    },
  });
}

export async function DELETE(req: NextRequest) {
  const check = await requireAdmin(req);
  if (!check.ok) return check.response;

  invalidateSiteCache();
  return NextResponse.json({ success: true, message: "Cache invalidated — will re-sync on next request." });
}
