import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const videoUrl = searchParams.get("url");
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!videoUrl || !apiKey) {
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
  }

  try {
    // 1. Extract Video ID
    const videoIdMatch = videoUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/);
    const videoId = videoIdMatch ? videoIdMatch[1] : null;

    if (!videoId) {
      return NextResponse.json({ error: "Invalid YouTube URL" }, { status: 400 });
    }

    // 2. Fetch Video Details to get Channel ID
    const videoRes = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${apiKey}`
    );
    const videoData = await videoRes.json();
    const channelId = videoData.items?.[0]?.snippet?.channelId;

    if (!channelId) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 });
    }

    // 3. Fetch Channel Statistics
    const channelRes = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${channelId}&key=${apiKey}`
    );
    const channelData = await channelRes.json();
    const subCount = parseInt(channelData.items?.[0]?.statistics?.subscriberCount || "0");

    // 4. Format Count (e.g., 1200 -> 1.2K)
    const formattedCount = formatNumber(subCount);

    return NextResponse.json({
      subscriberCount: formattedCount,
      channelId,
    });
  } catch (error) {
    console.error("YouTube Stats Error:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}

function formatNumber(num: number) {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  }
  return num.toString();
}
