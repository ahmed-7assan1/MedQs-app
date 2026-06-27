import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (session?.user?.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const videos = await prisma.lectureVideo.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        _count: { select: { videoViews: true, comments: true, likes: true } },
        lecture: { select: { id: true, title: true } },
      },
    });

    const videoIds = videos.map((v) => v.id);
    let viewStats: { videoId: string; uniqueViewers: number; totalWatchTime: number }[] = [];

    if (videoIds.length > 0) {
      const raw = await prisma.$queryRaw<{ videoId: string; uniqueViewers: bigint; totalWatchTime: bigint | null }[]>`
        SELECT "videoId",
               COUNT(DISTINCT "userId")::int as "uniqueViewers",
               COALESCE(SUM("watchDuration"), 0)::int as "totalWatchTime"
        FROM "VideoViewTracking"
        WHERE "videoId" IN (${videoIds.join(",")})
        GROUP BY "videoId"
      `;
      viewStats = raw.map((r) => ({
        videoId: r.videoId,
        uniqueViewers: Number(r.uniqueViewers),
        totalWatchTime: Number(r.totalWatchTime ?? 0),
      }));
    }

    const viewMap = new Map(viewStats.map((v) => [v.videoId, v]));

    const totalViews = videos.reduce((s, v) => s + v._count.videoViews, 0);
    const totalWatchTime = viewStats.reduce((s, v) => s + v.totalWatchTime, 0);
    const uniqueViewers = new Set(viewStats.map((v) => v.videoId)).size;

    const data = videos.map((v) => {
      const stats = viewMap.get(v.id);
      const duration = v.startTime != null && v.endTime != null ? v.endTime - v.startTime : undefined;
      return {
        id: v.id,
        title: v.title ?? v.lecture?.title ?? "Untitled",
        slug: "",
        duration,
        views: v._count.videoViews,
        uniqueViewers: stats?.uniqueViewers ?? 0,
        totalWatchTime: stats?.totalWatchTime ?? 0,
        avgWatchTime: v._count.videoViews > 0 ? Math.round((stats?.totalWatchTime ?? 0) / v._count.videoViews) : 0,
      };
    });

    const summary = {
      totalVideos: videos.length,
      totalViews,
      totalWatchTime,
    };

    return NextResponse.json({ data, summary });
  } catch (error: any) {
    console.error("[PLATFORM_VIDEO_ANALYTICS] Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
