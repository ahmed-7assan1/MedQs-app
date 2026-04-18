import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  const semesterId = (session?.user as any)?.semesterId;
  const apiKey = process.env.YOUTUBE_API_KEY;
  const { id } = params;

  try {
    // 1. Fetch Educator Info - Try DB first
    let instructorMeta: any = null;
    let dbId: string | null = null;
    let youtubeId: string = id;
    let followersCount = 0;
    let isFollowing = false;

    const dbInstructor = await (prisma as any).allowedChannel.findFirst({
      where: {
        OR: [
          { id: id },
          { youtubeId: id }
        ]
      },
      include: {
        _count: {
          select: { follows: true }
        }
      }
    });

    if (dbInstructor) {
      dbId = dbInstructor.id;
      youtubeId = dbInstructor.youtubeId;
      followersCount = dbInstructor._count.follows;
      instructorMeta = {
        name: dbInstructor.name,
        handle: dbInstructor.handle,
        thumbnail: dbInstructor.thumbnail,
        subscribers: dbInstructor.subscribers || "0"
      };

      if (session?.user?.id) {
        const follow = await (prisma as any).channelFollow.findUnique({
          where: {
            userId_channelId: {
              userId: session.user.id,
              channelId: dbInstructor.id
            }
          }
        });
        isFollowing = !!follow;
      }
    } else if (apiKey) {
      // Fallback: This is a discovered channel not yet in our DB
      const cRes = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${id}&key=${apiKey}`);
      const cData = await cRes.json();
      const item = cData.items?.[0];

      if (item) {
        instructorMeta = {
          name: item.snippet.title,
          handle: item.snippet.customUrl || `@${item.snippet.title.toLowerCase().replace(/\s/g, "")}`,
          thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url,
          subscribers: item.statistics.subscriberCount || "0"
        };
      }
    }

    if (!instructorMeta) {
      return NextResponse.json({ error: "Instructor not found" }, { status: 404 });
    }

    // 2. Fetch their videos (filtering by semester if student)
    const videos = await (prisma as any).lectureVideo.findMany({
      where: {
        OR: [
          { url: { contains: youtubeId } },
          { url: { contains: instructorMeta.handle?.replace("@", "") || "---" } }
        ],
        ...(semesterId ? {
           lecture: {
             subject: {
               semesterId: semesterId
             }
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
                 moduleId: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json({
      instructor: {
        id: dbId || youtubeId,
        youtubeId: youtubeId,
        name: instructorMeta.name,
        handle: instructorMeta.handle,
        thumbnail: instructorMeta.thumbnail,
        subscribers: instructorMeta.subscribers,
        followersCount,
        isFollowing
      },
      videos: videos.map((v: any) => {
         let vId = "";
         if (v.url.includes("v=")) vId = v.url.split("v=")[1].split("&")[0];
         else if (v.url.includes("youtu.be/")) vId = v.url.split("youtu.be/")[1].split("?")[0];
         return {
            id: v.id,
            videoId: vId,
            title: v.title,
            thumbnail: vId ? `https://img.youtube.com/vi/${vId}/mqdefault.jpg` : null,
            lectureId: v.lecture.id,
            lectureTitle: v.lecture.title,
            moduleId: v.lecture.subject.moduleId,
            subjectName: v.lecture.subject.name
         };
      })
    });
  } catch (error) {
    console.error("Instructor Profile API Error:", error);
    return NextResponse.json({ error: "Operation failed" }, { status: 500 });
  }
}
