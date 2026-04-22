import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const videoUrl = searchParams.get("url");
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!videoUrl) {
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
  }

  const cacheKey = `yt:metadata:${Buffer.from(videoUrl).toString("base64")}`;

  try {
    // 1. Check Cache
    const cached = await redis.get(cacheKey);
    if (cached) {
      return NextResponse.json(JSON.parse(cached));
    }

    // 2. Extract Video ID
    const videoIdMatch = videoUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/);
    const videoId = videoIdMatch ? videoIdMatch[1] : null;

    if (!videoId || !apiKey) {
      console.warn("[youtube-stats] Missing VideoId or API Key", { videoId, hasKey: !!apiKey });
      // Fallback to oEmbed only if no API key or invalid ID
      const oRes = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(videoUrl)}&format=json`);
      const oData = await oRes.json();
      return NextResponse.json({
        name: oData.author_name || "Unknown Creator",
        subscriberCount: "??",
      });
    }

    // 3. Fetch Video Details to get Channel ID & Author Name
    const videoRes = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${apiKey}`
    );
    const videoData = await videoRes.json();
    const snippet = videoData.items?.[0]?.snippet;
    const channelId = snippet?.channelId;
    const authorName = snippet?.channelTitle;

    if (!channelId) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 });
    }

    // 4. Fetch Channel Statistics
    const channelRes = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${channelId}&key=${apiKey}`
    );
    const channelData = await channelRes.json();
    const subCount = parseInt(channelData.items?.[0]?.statistics?.subscriberCount || "0");

    const result = {
      name: authorName || "Unknown Creator",
      subscriberCount: formatNumber(subCount),
      channelId,
    };

    // 5. Cache for 24 hours
    await redis.setex(cacheKey, 86400, JSON.stringify(result));

    return NextResponse.json(result);
  } catch (error) {
    console.error("YouTube Stats Error:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}

function formatNumber(num: number) {
  if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  return num.toString();
}
