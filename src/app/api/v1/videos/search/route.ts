import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

/**
 * Tiered Academic Search: 
 * 1. Database (Curriculum) - Matches based on Lecture Title, Subject, or Module.
 * 2. YouTube Discovery - Global discovery fallback.
 */
export async function GET(req: NextRequest) {
  const session = await auth();
  const semesterId = (session?.user as any)?.semesterId;
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!q) return NextResponse.json([]);

  try {
    // 1. Database Search (Prioritize Local Curriculum)
    const dbVideos = await (prisma as any).lectureVideo.findMany({
      where: {
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { lecture: { title: { contains: q, mode: "insensitive" } } },
          { lecture: { subject: { name: { contains: q, mode: "insensitive" } } } },
          { lecture: { subject: { module: { name: { contains: q, mode: "insensitive" } } } } }
        ],
        ...(semesterId ? {
          lecture: {
            subject: { semesterId: semesterId }
          }
        } : {})
      },
      include: {
        lecture: {
          select: {
            id: true,
            title: true,
            subject: {
              select: { 
                 name: true,
                 moduleId: true,
                 module: { select: { name: true } }
              }
            }
          }
        }
      },
      take: 20
    });

    const vIdList: string[] = [];
    const dbResults = dbVideos.map((v: any) => {
       let videoId = "";
       if (v.url.includes("v=")) videoId = v.url.split("v=")[1].split("&")[0];
       else if (v.url.includes("youtu.be/")) videoId = v.url.split("youtu.be/")[1].split("?")[0];
       
       if (videoId) vIdList.push(videoId);

       return {
          id: v.id,
          videoId: videoId,
          title: v.title,
          thumbnail: videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : null,
          lectureId: v.lecture.id,
          lectureTitle: v.lecture.title,
          moduleId: v.lecture.subject.moduleId,
          moduleName: v.lecture.subject.module.name,
          subjectName: v.lecture.subject.name,
          source: "medqs",
          isCurriculum: true
       };
    });

    // 2. YouTube Search (Discovery Fallback if results are low)
    let ytResults: any[] = [];
    if (dbResults.length < 5 && apiKey) {
       const ytRes = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=10&q=${encodeURIComponent(q)}&type=video&key=${apiKey}`);
       const ytData = await ytRes.json();
       
       ytResults = (ytData.items || []).map((item: any) => ({
          id: item.id.videoId,
          videoId: item.id.videoId,
          title: item.snippet.title,
          thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url,
          channelTitle: item.snippet.channelTitle,
          channelId: item.snippet.channelId,
          source: "youtube",
          isCurriculum: false
       }));
    }

    // Resolve channel thumbnails for DB results
    let channelMetadata: any = {};
    if (apiKey && vIdList.length > 0) {
       const idsStr = [...new Set(vIdList)].join(",");
       const vRes = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${idsStr}&key=${apiKey}`);
       const vData = await vRes.json();
       const channelIds = [...new Set((vData.items || []).map((i: any) => i.snippet.channelId))];
       
       if (channelIds.length > 0) {
          const cRes = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=snippet&id=${channelIds.join(",")}&key=${apiKey}`);
          const cData = await cRes.json();
          const chanMap = new Map((cData.items || []).map((i: any) => [i.id, { title: i.snippet.title, thumbnail: i.snippet.thumbnails.default.url }]));
          const videoToChanMap = new Map((vData.items || []).map((i: any) => [i.id, chanMap.get(i.snippet.channelId)]));
          channelMetadata = Object.fromEntries(videoToChanMap);
       }
    }

    const finalDb = dbResults.map((v: any) => ({
       ...v,
       channelTitle: channelMetadata[v.videoId]?.title || "Medical Educator",
       channelThumbnail: channelMetadata[v.videoId]?.thumbnail || null
    }));

    return NextResponse.json([...finalDb, ...ytResults]);
  } catch (error) {
    console.error("Search API Error:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
