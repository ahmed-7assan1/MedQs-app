import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// This endpoint should be called daily by Vercel Cron or any other external cron service
export async function GET(req: NextRequest) {
  try {
    // 1. Authenticate the cron request (Vercel uses a special header)
    // For local testing, we can bypass this or use a simple secret
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'dev_secret';
    
    // In production, ensure this endpoint is protected
    if (process.env.NODE_ENV === "production" && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tasks = await (prisma as any).playlistSyncTask.findMany({
      include: {
        semester: {
          include: {
            modules: {
              include: { subjects: true }
            }
          }
        }
      }
    });

    if (tasks.length === 0) {
      return NextResponse.json({ message: "No active auto-sync tasks." });
    }

    let totalSynced = 0;

    for (const task of tasks) {
      try {
        const { playlistUrl, mediaType, editionYear, semester } = task;
        const isYouTube = playlistUrl.includes("youtube.com") || playlistUrl.includes("youtu.be");
        let itemsToSync: { title: string; url: string; originalSource: string }[] = [];

        // Fetch YouTube Items
        if (isYouTube) {
          const apiKey = process.env.YOUTUBE_API_KEY;
          let playlistId = "";
          if (playlistUrl.includes("list=")) playlistId = playlistUrl.split("list=")[1].split("&")[0];
          
          if (playlistId && apiKey) {
            let nextPageToken = "";
            do {
              const res = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${playlistId}&key=${apiKey}${nextPageToken ? `&pageToken=${nextPageToken}` : ""}`);
              if (res.ok) {
                const data = await res.json();
                const newItems = data.items.map((item: any) => ({
                  title: item.snippet.title,
                  url: `https://www.youtube.com/watch?v=${item.snippet.resourceId.videoId}`,
                  originalSource: "youtube"
                }));
                itemsToSync = [...itemsToSync, ...newItems];
                nextPageToken = data.nextPageToken;
              } else {
                break;
              }
            } while (nextPageToken);
          }
        }

        // Fetch Spotify Items
        const isSpotify = playlistUrl.includes("spotify.com");
        if (isSpotify) {
          const clientId = process.env.SPOTIFY_CLIENT_ID;
          const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
          let playlistId = "";
          if (playlistUrl.includes("/playlist/")) playlistId = playlistUrl.split("/playlist/")[1].split("?")[0];
          
          if (playlistId && clientId && clientSecret) {
            const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
              method: "POST",
              headers: { "Content-Type": "application/x-www-form-urlencoded", "Authorization": "Basic " + Buffer.from(clientId + ":" + clientSecret).toString("base64") },
              body: "grant_type=client_credentials"
            });
            
            if (tokenRes.ok) {
              const { access_token } = await tokenRes.json();
              
              let nextUrl = `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=50`;
              do {
                const tracksRes = await fetch(nextUrl, {
                  headers: { "Authorization": `Bearer ${access_token}` }
                });
                if (tracksRes.ok) {
                  const tracksData = await tracksRes.json();
                  const newItems = tracksData.items.map((item: any) => ({
                    title: item.track.name,
                    url: item.track.external_urls.spotify,
                    originalSource: "spotify"
                  }));
                  itemsToSync = [...itemsToSync, ...newItems];
                  nextUrl = tracksData.next;
                } else {
                  break;
                }
              } while (nextUrl);
            }
          }
        }

        if (itemsToSync.length === 0) continue;

        // Fetch existing records to prevent duplicates
        const existingLectures = await (prisma as any).lecture.findMany({
          where: { subject: { module: { semesterId: task.semesterId } } },
          include: { videos: true, records: true }
        });
        
        const existingUrls = new Set([
          ...existingLectures.flatMap((l: any) => l.videos.map((v: any) => v.url)),
          ...existingLectures.flatMap((l: any) => l.records.map((r: any) => r.url))
        ]);

        const subjects = semester.modules.flatMap((m: any) => m.subjects);
        if (subjects.length === 0) continue;

        // Process only NEW items
        for (const item of itemsToSync) {
          if (existingUrls.has(item.url)) continue; // Already synced!

          // Smart Matching
          let matchedSubject = subjects.find((s: any) => 
            item.title.toLowerCase().includes(s.name.toLowerCase()) || 
            (s.name.toLowerCase() !== "general" && item.title.toLowerCase().includes(s.name.toLowerCase().substring(0, 4)))
          );
          
          if (!matchedSubject) continue; // Skip if it doesn't match any subject

          const finalTitle = `${item.title}${editionYear ? ` - ${editionYear}` : ""}`;

          const lecture = await (prisma as any).lecture.create({
            data: { title: finalTitle, subjectId: matchedSubject.id, sortOrder: 0 }
          });

          if (mediaType === "video") {
            await (prisma as any).lectureVideo.create({
              data: { title: item.title, url: item.url, lectureId: lecture.id, sourceType: item.originalSource }
            });
          } else {
            await (prisma as any).lectureRecord.create({
              data: { title: item.title, url: item.url, lectureId: lecture.id, sourceType: item.originalSource }
            });
          }
          totalSynced++;
        }

        // Update task lastSynced time
        await (prisma as any).playlistSyncTask.update({
          where: { id: task.id },
          data: { lastSynced: new Date() }
        });

      } catch (err) {
        console.error(`Failed to process task ${task.id}`, err);
      }
    }

    return NextResponse.json({ success: true, message: `Cron run complete. Synced ${totalSynced} new items.` });
  } catch (error) {
    console.error("Cron Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
