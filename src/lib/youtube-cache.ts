import { unstable_cache } from "next/cache";
import { CACHE_TAGS, CACHE_TTL } from "@/lib/cache-tags";

const YOUTUBE_TIMEOUT_MS = 5000;

async function fetchYouTubeChannelMetadata(videoIds: string[]) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey || videoIds.length === 0) return {};

  const idsStr = [...new Set(videoIds)].join(",");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), YOUTUBE_TIMEOUT_MS);

  try {
    const vRes = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${idsStr}&key=${apiKey}`,
      { signal: controller.signal }
    );
    const vData = await vRes.json();

    const channelIds = [...new Set((vData.items || []).map((i: any) => i.snippet.channelId))];

    if (channelIds.length === 0) return {};

    const cRes = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=snippet&id=${channelIds.join(",")}&key=${apiKey}`,
      { signal: controller.signal }
    );
    const cData = await cRes.json();

    const chanMap = new Map(
      (cData.items || []).map((i: any) => [
        i.id,
        { title: i.snippet.title, thumbnail: i.snippet.thumbnails.default.url },
      ])
    );

    const videoToChanMap = new Map(
      (vData.items || []).map((i: any) => [i.id, chanMap.get(i.snippet.channelId)])
    );

    return Object.fromEntries(videoToChanMap);
  } finally {
    clearTimeout(timeout);
  }
}

export const getCachedYouTubeData = unstable_cache(
  async (videoIds: string[]) => {
    return fetchYouTubeChannelMetadata(videoIds);
  },
  ["youtube-channel-data"],
  { revalidate: CACHE_TTL.YOUTUBE, tags: [CACHE_TAGS.YOUTUBE] }
);
