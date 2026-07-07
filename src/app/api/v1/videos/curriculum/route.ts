import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getYouTubeId } from "@/lib/video-utils";
import { getCachedYouTubeData } from "@/lib/youtube-cache";

export async function GET(req: NextRequest) {
  const session = await auth();
  const semesterId = (session?.user as any)?.semesterId;

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
      prisma.lectureVideo.findMany({
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
      prisma.lectureVideo.count({ where })
    ]);

    const vIdList: string[] = [];
    const formattedRaw = videos.map((v: any) => {
       const videoId = getYouTubeId(v.url) || "";
       
       if (videoId) vIdList.push(videoId);

       return {
          id: v.id,
          videoId: videoId,
          title: v.title,
          thumbnail: videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : null,
          lectureId: v.lecture.id,
          lectureTitle: v.lecture.title,
          moduleId: v.lecture.subject.moduleId,
          subjectName: v.lecture.subject.name,
          source: "medqs"
       };
    });

    // Resolve Channel Avatars & Titles via server-side cache (3600s TTL)
    let channelMetadata: Record<string, { title: string; thumbnail: string } | undefined> = {};
    if (vIdList.length > 0) {
      try {
        channelMetadata = await getCachedYouTubeData(vIdList);
      } catch {
        // Cache miss or YouTube unavailable — fall through with empty metadata
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
