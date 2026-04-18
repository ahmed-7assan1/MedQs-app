import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await auth();
  const semesterId = (session?.user as any)?.semesterId;
  const apiKey = process.env.YOUTUBE_API_KEY;

  try {
    // 1. Fetch Manual "Official" Channels
    const manualChannels = await (prisma as any).allowedChannel.findMany({
      include: {
        _count: {
          select: { follows: true }
        }
      }
    });

    // 2. Fetch Active Curriculum Channels (Autonomous Discovery)
    const lectureVideos = await (prisma as any).lectureVideo.findMany({
      where: semesterId ? {
        lecture: {
          subject: {
            semesterId: semesterId
          }
        }
      } : {},
      select: { url: true }
    });

    const videoIds = [...new Set(lectureVideos.map((v: any) => {
       if (v.url.includes("v=")) return v.url.split("v=")[1].split("&")[0];
       if (v.url.includes("youtu.be/")) return v.url.split("youtu.be/")[1].split("?")[0];
       return null;
    }).filter(Boolean))];

    // 3. Resolve these channels via YouTube
    let discoveredChannels: any[] = [];
    if (apiKey && videoIds.length > 0) {
       // Step A: Find Channel IDs from Video IDs
       const idsStr = videoIds.slice(0, 50).join(",");
       const vRes = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${idsStr}&key=${apiKey}`);
       const vData = await vRes.json();
       
       const channelIds = [...new Set((vData.items || []).map((i: any) => i.snippet.channelId))];
       
       // Step B: Get rich channel info (Avatar, Title)
       if (channelIds.length > 0) {
          const chanIdsStr = channelIds.join(",");
          const cRes = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=snippet&id=${chanIdsStr}&key=${apiKey}`);
          const cData = await cRes.json();
          
          discoveredChannels = (cData.items || []).map((item: any) => ({
             id: item.id,
             youtubeId: item.id,
             name: item.snippet.title,
             thumbnail: item.snippet.thumbnails.default.url,
             followersCount: 0,
             isFollowing: false,
             isDiscovered: true
          }));
       }
    }

    // 4. Update Manual Channels with latest YT Avatars if possible
    let finalManual = manualChannels;
    if (apiKey && manualChannels.length > 0) {
       const mIds = manualChannels.map((c: any) => c.youtubeId).join(",");
       const cRes = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=snippet&id=${mIds}&key=${apiKey}`);
       const cData = await cRes.json();
       const ytAvatarMap = new Map((cData.items || []).map((i: any) => [i.id, i.snippet.thumbnails.default.url]));
       
       finalManual = manualChannels.map((c: any) => ({
          ...c,
          thumbnail: ytAvatarMap.get(c.youtubeId) || c.thumbnail
       }));
    }

    // 5. Merge
    const manualMap = new Map(finalManual.map((c: any) => [c.youtubeId, c]));
    
    // Check follows
    if (session?.user?.id) {
       const allChanIds = [...finalManual.map((c: any) => c.id), ...discoveredChannels.map(d => d.id)];
       const follows = await (prisma as any).channelFollow.findMany({
         where: { userId: session.user.id, channelId: { in: allChanIds } }
       });
       const followedSet = new Set(follows.map((f: any) => f.channelId));
       
       discoveredChannels = discoveredChannels.map(d => ({ ...d, isFollowing: followedSet.has(d.id) }));
       finalManual = finalManual.map((c: any) => ({ ...c, isFollowing: followedSet.has(c.id) }));
    }

    const unified = [
      ...finalManual.map((c: any) => ({
        id: c.id,
        youtubeId: c.youtubeId,
        name: c.name,
        handle: c.handle,
        thumbnail: c.thumbnail,
        subscribers: c.subscribers || "0",
        followersCount: c._count?.follows || 0,
        isFollowing: c.isFollowing,
        isDiscovered: false
      })),
      ...discoveredChannels.filter(d => !manualMap.has(d.youtubeId))
    ];

    unified.sort((a, b) => (a.isFollowing === b.isFollowing ? a.name.localeCompare(b.name) : a.isFollowing ? -1 : 1));

    return NextResponse.json(unified);
  } catch (error) {
    console.error("Instructors API Error:", error);
    return NextResponse.json({ error: "Operation failed" }, { status: 500 });
  }
}
