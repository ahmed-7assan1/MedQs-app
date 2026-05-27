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
       // Batch process all unique video IDs (up to 50 per request)
       const idsStr = videoIds.slice(0, 50).join(",");
       const vRes = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${idsStr}&key=${apiKey}`);
       const vData = await vRes.json();
       
       const channelIds = [...new Set((vData.items || []).map((i: any) => i.snippet.channelId))];
       
       // Step B: Get rich channel info (Avatar, Title, Subscribers)
       if (channelIds.length > 0) {
          const chanIdsStr = channelIds.join(",");
          const cRes = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${chanIdsStr}&key=${apiKey}`);
          const cData = await cRes.json();
          
          discoveredChannels = (cData.items || []).map((item: any) => ({
             id: item.id,
             youtubeId: item.id,
             name: item.snippet.title,
             thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default.url,
             subscribers: formatSubs(item.statistics?.subscriberCount),
             followersCount: 0,
             isFollowing: false,
             isDiscovered: true
          }));
       }
    }

    // Helper to format subs (e.g. 1.2M)
    function formatSubs(count: string | undefined) {
      if (!count) return "0";
      const num = parseInt(count);
      if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
      if (num >= 1000) return (num / 1000).toFixed(1) + "K";
      return count;
    }

    // 4. Update Manual Channels with latest YT Avatars if possible
    let finalManual = manualChannels;
    if (apiKey && manualChannels.length > 0) {
       const mIds = manualChannels.map((c: any) => c.youtubeId).join(",");
       const cRes = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${mIds}&key=${apiKey}`);
       const cData = await cRes.json();
       const ytDataMap = new Map((cData.items || []).map((i: any) => [
         i.id, 
         { 
           thumbnail: i.snippet.thumbnails.high?.url || i.snippet.thumbnails.default.url,
           subs: formatSubs(i.statistics?.subscriberCount)
         }
       ]));
       
       finalManual = manualChannels.map((c: any) => {
          const yt = ytDataMap.get(c.youtubeId);
          return {
            ...c,
            thumbnail: (yt as any)?.thumbnail || c.thumbnail,
            subscribers: (yt as any)?.subs || c.subscribers
          };
       });
    }

    // 5. Merge and Brand
    const manualMap = new Map(finalManual.map((c: any) => [c.youtubeId, c]));
    
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

    const platformLogo = "/logo.png";

    const brandedUnified = unified.map(instructor => {
      let name = instructor.name;
      let thumbnail = instructor.thumbnail;

      if (name.includes("Ahmed Jumaa") || name.includes("أحمد جمعة") || name.includes("د. كيو")) {
        return {
          ...instructor,
          name: "د. كيو",
          subscribers: "12.8K",
          thumbnail: `https://unavatar.io/youtube/@DrQ_MedQs`
        };
      }
      
      if (!thumbnail || thumbnail.includes("placeholder")) {
        thumbnail = platformLogo;
      }

      return { ...instructor, name, thumbnail };
    });

    brandedUnified.sort((a, b) => (a.isFollowing === b.isFollowing ? a.name.localeCompare(b.name) : a.isFollowing ? -1 : 1));

    return NextResponse.json(brandedUnified, {
      headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
    });
  } catch (error) {
    console.error("Instructors API Error:", error);
    return NextResponse.json({ error: "Operation failed" }, { status: 500 });
  }
}
