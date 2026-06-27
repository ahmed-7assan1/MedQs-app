import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const body = await req.json();
    const { videoId, lectureId, watchDurationSeconds, watchPercentage, completed } = body;

    if (!videoId) {
      return NextResponse.json({ error: "videoId required" }, { status: 400 });
    }

    await prisma.videoViewTracking.create({
      data: {
        videoId,
        userId: session?.user?.id ?? null,
        lectureId: lectureId ?? null,
        watchDurationSeconds: watchDurationSeconds ?? null,
        watchPercentage: watchPercentage ?? null,
        completed: completed ?? false,
        ipAddress: req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip"),
      },
    });

    if (completed) {
      await prisma.lectureVideo.update({
        where: { id: videoId },
        data: { viewCount: { increment: 1 } },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[VIDEO_TRACK] Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
