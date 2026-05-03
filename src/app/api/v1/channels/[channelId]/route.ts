import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  ctx: { params: { channelId: string } }
) {
  const session = await auth();
  const semesterId = (session?.user as any)?.semesterId;
  const apiKey = process.env.YOUTUBE_API_KEY;
  const { channelId } = ctx.params;

  try {
    // 1. Get Channel Basic Info from YouTube
    let channelInfo = {
      id: channelId,
      name: "Medical Educator",
      thumbnail: "",
      subscribers: "0",
      description: "",
      banner: ""
    };

    if (apiKey) {
      const cRes = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,brandingSettings&id=${channelId}&key=${apiKey}`);
      const cData = await cRes.json();
      if (cData.items?.[0]) {
        const item = cData.items[0];
        channelInfo = {
          id: channelId,
          name: item.snippet.title,
          thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default.url,
          subscribers: item.statistics.subscriberCount,
          description: item.snippet.description,
          banner: item.brandingSettings?.image?.bannerExternalUrl || ""
        };
      }
    }

    // 2. Fetch all LectureVideos associated with this channel in the current semester
    // We need to match by YouTube ID extracted from URL
    const allVideos = await (prisma as any).lectureVideo.findMany({
      where: semesterId ? {
        lecture: {
          subject: {
            semesterId: semesterId
          }
        }
      } : {},
      include: {
        lecture: {
          select: {
            id: true,
            title: true,
            subject: {
              select: { name: true, moduleId: true }
            }
          }
        }
      }
    });

    // Filter videos that belong to this channel
    // Since we don't store channelId in DB, we have to resolve it or use a heuristic
    // For performance, we'll return all videos but we should ideally have a way to filter.
    // In a real scenario, we'd need to batch check video IDs against channel ID via YT API.
    
    // For now, let's filter by checking which videos from the semester belong to this channelId
    const vIdList = allVideos.map((v: any) => {
       const url = v.url || "";
       if (url.includes("v=")) return url.split("v=")[1].split("&")[0];
       if (url.includes("youtu.be/")) return url.split("youtu.be/")[1].split("?")[0];
       return null;
    }).filter(Boolean);

    let matchingVideoIds: string[] = [];
    if (apiKey && vIdList.length > 0) {
       // Check which of these video IDs belong to this channel
       // Batch 50 at a time
       const ids = [...new Set(vIdList)];
       const vRes = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${ids.slice(0, 50).join(",")}&key=${apiKey}`);
       const vData = await vRes.json();
       matchingVideoIds = (vData.items || [])
         .filter((i: any) => i.snippet.channelId === channelId)
         .map((i: any) => i.id);
    }

    const filtered = allVideos.filter((v: any) => {
       const url = v.url || "";
       let vid = "";
       if (url.includes("v=")) vid = url.split("v=")[1].split("&")[0];
       else if (url.includes("youtu.be/")) vid = url.split("youtu.be/")[1].split("?")[0];
       return matchingVideoIds.includes(vid);
    }).map((v: any) => {
       let videoId = "";
       if (v.url.includes("v=")) videoId = v.url.split("v=")[1].split("&")[0];
       else if (v.url.includes("youtu.be/")) videoId = v.url.split("youtu.be/")[1].split("?")[0];

       return {
          id: v.id,
          videoId: videoId,
          title: v.title,
          thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
          lectureId: v.lecture.id,
          moduleId: v.lecture.subject.moduleId,
          subjectName: v.lecture.subject.name,
          channelTitle: channelInfo.name,
          channelThumbnail: channelInfo.thumbnail
       };
    });

    return NextResponse.json({
      channel: channelInfo,
      videos: filtered
    });
  } catch (error) {
    console.error("Channel API Error:", error);
    return NextResponse.json({ error: "Failed to fetch channel details" }, { status: 500 });
  }
}
