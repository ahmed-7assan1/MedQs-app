import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await auth();
  const semesterId = (session?.user as any)?.semesterId;
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!semesterId) {
    return NextResponse.json({ message: "Please complete onboarding to see curriculum videos." }, { status: 400 });
  }

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(50, Math.max(4, Number(searchParams.get("limit") ?? 12)));
  const skip = (page - 1) * limit;

  try {
    const where = {
      lecture: {
        subject: {
          module: {
            semesterId: semesterId
          }
        }
      }
    };

    const [videos, total] = await Promise.all([
      (prisma as any).lectureVideo.findMany({
        where,
        include: {
          lecture: {
            select: {
              id: true,
              title: true,
              subject: {
                select: { 
                  name: true,
                  moduleId: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit
      }),
      (prisma as any).lectureVideo.count({ where })
    ]);

    const vIdList: string[] = [];
    const formattedRaw = videos.map((v: any) => {
       let videoId = "";
       const url = v.url || "";
       if (url.includes("v=")) videoId = url.split("v=")[1].split("&")[0];
       else if (url.includes("youtu.be/")) videoId = url.split("youtu.be/")[1].split("?")[0];
       
       if (videoId) vIdList.push(videoId);

       return {
          id: v.id,
          videoId: videoId,
          title: v.title,
          thumbnail: videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null,
          lectureId: v.lecture.id,
          lectureTitle: v.lecture.title,
          moduleId: v.lecture.subject.moduleId,
          subjectName: v.lecture.subject.name,
          source: "medqs"
       };
    });

    // Resolve Channel Avatars & Titles from YouTube (Only for this page's videos)
    let channelMetadata: any = {};
    if (apiKey && vIdList.length > 0) {
       const idsStr = [...new Set(vIdList)].join(",");
       const vRes = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${idsStr}&key=${apiKey}`);
       const vData = await vRes.json();
       
       const channelIds = [...new Set((vData.items || []).map((i: any) => i.snippet.channelId))];
       
       if (channelIds.length > 0) {
          const cRes = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=snippet&id=${channelIds.join(",")}&key=${apiKey}`);
          const cData = await cRes.json();
          
          const chanMap = new Map((cData.items || []).map((i: any) => [i.id, { 
             title: i.snippet.title, 
             thumbnail: i.snippet.thumbnails.default.url 
          }]));

          const videoToChanMap = new Map((vData.items || []).map((i: any) => [i.id, chanMap.get(i.snippet.channelId)]));
          channelMetadata = Object.fromEntries(videoToChanMap);
       }
    }

    const final = formattedRaw.map((v: any) => ({
       ...v,
       channelTitle: channelMetadata[v.videoId]?.title || "Medical Educator",
       channelThumbnail: channelMetadata[v.videoId]?.thumbnail || null
    }));

    return NextResponse.json({
      items: final,
      total,
      page,
      hasMore: skip + videos.length < total
    }, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    console.error("Curriculum Videos Error:", error);
    return NextResponse.json({ error: "Failed to fetch curriculum videos" }, { status: 500 });
  }
}
