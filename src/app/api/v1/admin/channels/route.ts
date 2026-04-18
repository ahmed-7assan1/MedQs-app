import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const channels = await (prisma as any).allowedChannel.findMany({
      include: {
        _count: {
          select: { follows: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });
    return NextResponse.json(channels);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch channels" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { urlOrId } = await req.json();
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!urlOrId || !apiKey) {
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
  }

  try {
    // 1. Resolve Channel ID from URL, Handle, or direct Video link
    let channelId = "";
    const cleanInput = urlOrId.trim();

    try {
      if (cleanInput.includes("youtube.com/channel/")) {
        channelId = cleanInput.split("channel/")[1].split("/")[0].split("?")[0];
      } else if (cleanInput.includes("youtube.com/@") || cleanInput.startsWith("@")) {
        const handle = cleanInput.includes("@") ? "@" + cleanInput.split("@")[1].split("/")[0].split("?")[0] : cleanInput;
        const res = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=id&forHandle=${encodeURIComponent(handle)}&key=${apiKey}`);
        const data = await res.json();
        channelId = data.items?.[0]?.id;
      } else if (cleanInput.includes("youtube.com/user/")) {
        const username = cleanInput.split("user/")[1].split("/")[0].split("?")[0];
        const res = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=id&forUsername=${encodeURIComponent(username)}&key=${apiKey}`);
        const data = await res.json();
        channelId = data.items?.[0]?.id;
      } else if (cleanInput.includes("youtu.be/") || cleanInput.includes("youtube.com/watch")) {
        let vId = "";
        if (cleanInput.includes("youtu.be/")) {
           vId = cleanInput.split("youtu.be/")[1].split("?")[0].split("/")[0];
        } else {
           vId = cleanInput.split("v=")[1]?.split("&")[0];
        }
        
        if (vId) {
           const vRes = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${vId}&key=${apiKey}`);
           const vData = await vRes.json();
           channelId = vData.items?.[0]?.snippet?.channelId;
        }
      } else if (cleanInput.startsWith("UC")) {
        channelId = cleanInput;
      } else {
        const res = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(cleanInput)}&type=channel&maxResults=1&key=${apiKey}`);
        const data = await res.json();
        channelId = data.items?.[0]?.id?.channelId;
      }
    } catch (e) {
      console.error("Resolution Error:", e);
    }

    if (!channelId) {
      return NextResponse.json({ error: "Could not resolve YouTube Channel" }, { status: 404 });
    }

    // 2. Fetch Channel Metadata
    const channelRes = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${channelId}&key=${apiKey}`
    );
    const channelData = await channelRes.json();
    const item = channelData.items?.[0];

    if (!item) {
      return NextResponse.json({ error: "Channel not found on YouTube" }, { status: 404 });
    }

    // 3. Save to database
    const channel = await (prisma as any).allowedChannel.upsert({
      where: { youtubeId: channelId },
      update: {
        name: item.snippet.title,
        handle: item.snippet.customUrl,
        thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url,
        description: item.snippet.description,
        subscribers: formatCount(item.statistics.subscriberCount)
      },
      create: {
        youtubeId: channelId,
        name: item.snippet.title,
        handle: item.snippet.customUrl,
        thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url,
        description: item.snippet.description,
        subscribers: formatCount(item.statistics.subscriberCount)
      }
    });

    return NextResponse.json(channel);
  } catch (error) {
    console.error("Add Channel Error:", error);
    return NextResponse.json({ error: "Failed to add channel" }, { status: 500 });
  }
}

function formatCount(numStr: string) {
  const num = parseInt(numStr);
  if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  return numStr;
}
