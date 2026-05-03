import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { channelId, subscribe = true } = await req.json();
    if (!channelId) return NextResponse.json({ error: "Channel ID required" }, { status: 400 });

    // 1. Get Google Access Token from Account table
    const account = await prisma.account.findFirst({
      where: { userId: session.user.id, provider: "google" },
      select: { access_token: true }
    });

    if (!account?.access_token) {
      return NextResponse.json({ error: "Google account not linked or missing permissions" }, { status: 400 });
    }

    if (subscribe) {
      // YouTube API: Subscription: insert
      const res = await fetch(`https://www.googleapis.com/youtube/v3/subscriptions?part=snippet`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${account.access_token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          snippet: {
            resourceId: {
              kind: "youtube#channel",
              channelId: channelId
            }
          }
        })
      });

      if (!res.ok) {
        const err = await res.json();
        // If already subscribed, YouTube returns 400 or 409 usually
        if (res.status === 400 && err.error?.message?.includes("already subscribed")) {
           return NextResponse.json({ ok: true, message: "Already subscribed" });
        }
        return NextResponse.json({ error: err.error?.message || "YouTube API error" }, { status: res.status });
      }
    } else {
      // Unsubscribe logic would require finding the subscriptionId first
      // For now, let's just support subscribing
    }

    // 2. Also track in our local DB if the channel exists
    const localChan = await prisma.allowedChannel.findUnique({ where: { youtubeId: channelId } });
    if (localChan) {
      await prisma.channelFollow.upsert({
        where: { userId_channelId: { userId: session.user.id, channelId: localChan.id } },
        create: { userId: session.user.id, channelId: localChan.id },
        update: {}
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[YT Subscribe]", error);
    return NextResponse.json({ error: "Failed to process subscription" }, { status: 500 });
  }
}
