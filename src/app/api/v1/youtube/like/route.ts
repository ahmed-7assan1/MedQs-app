import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { videoId, rating = "like" } = await req.json(); // rating: "like", "none", "dislike"
    if (!videoId) return NextResponse.json({ error: "Video ID required" }, { status: 400 });

    const account = await prisma.account.findFirst({
      where: { userId: session.user.id, provider: "google" },
      select: { access_token: true }
    });

    if (!account?.access_token) {
      return NextResponse.json({ error: "Google account not linked" }, { status: 400 });
    }

    // YouTube API: Videos: rate
    const res = await fetch(`https://www.googleapis.com/youtube/v3/videos/rate?id=${videoId}&rating=${rating}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${account.access_token}`
      }
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return NextResponse.json({ error: err.error?.message || "YouTube API error" }, { status: res.status });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[YT Like]", error);
    return NextResponse.json({ error: "Failed to process rating" }, { status: 500 });
  }
}
