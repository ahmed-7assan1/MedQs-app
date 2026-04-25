import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const videoUrl = searchParams.get("url");
  const videoIdParam = searchParams.get("videoId");
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!videoUrl && !videoIdParam) {
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
  }

  const cacheKey = `yt:metadata:${Buffer.from(videoUrl || videoIdParam || "").toString("base64")}`;

  try {
    // 1. Check Cache
    const cached = await redis.get(cacheKey);
    if (cached) {
      return NextResponse.json(JSON.parse(cached));
    }

    // 2. Extract Video ID
    let videoId = videoIdParam;
    if (!videoId && videoUrl) {
      const videoIdMatch = videoUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/);
      videoId = videoIdMatch ? videoIdMatch[1] : null;
    }

    if (!videoId || !apiKey) {
      console.warn("[youtube-stats] Missing VideoId or API Key", { videoId, hasKey: !!apiKey });
      if (videoUrl) {
        const oRes = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(videoUrl)}&format=json`);
        const oData = await oRes.json();
        return NextResponse.json({
          name: oData.author_name || "Unknown Creator",
          subscriberCount: "??",
        });
      }
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    // 3. Fetch Video Details to get Channel ID, Author Name, Description & Stats
    const videoRes = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoId}&key=${apiKey}`
    );
    const videoData = await videoRes.json();
    const item = videoData.items?.[0];
    const snippet = item?.snippet;
    const statistics = item?.statistics;
    
    const channelId = snippet?.channelId;
    const authorName = snippet?.channelTitle;
    const description = snippet?.description;
    const viewCount = parseInt(statistics?.viewCount || "0");
    const likeCount = parseInt(statistics?.likeCount || "0");

    if (!channelId) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 });
    }

    // 4. Fetch Channel Details (Snippet for Thumbnail + Statistics for Subs)
    const channelRes = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${channelId}&key=${apiKey}`
    );
    const channelData = await channelRes.json();
    const channelItem = channelData.items?.[0];
    const subCount = parseInt(channelItem?.statistics?.subscriberCount || "0");
    const channelThumbnail = channelItem?.snippet?.thumbnails?.default?.url;

    const result = {
      name: authorName || "Unknown Creator",
      thumbnail: channelThumbnail,
      subscriberCount: formatNumber(subCount),
      channelId,
      description,
      viewCount: formatNumber(viewCount),
      likeCount: formatNumber(likeCount),
    };

    // 5. Cache for 12 hours (shorter for stats)
    await redis.setex(cacheKey, 43200, JSON.stringify(result));

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
