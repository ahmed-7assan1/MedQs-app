import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || (session.user as any).role !== "SUPER_ADMIN" && (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { playlistUrl, semesterId, editionYear, action, mediaType, overwrite, autoSync, items } = body;

    // Handle COMMIT
    if (action === "commit" && items && Array.isArray(items)) {
      if (overwrite) {
        const allSemesterLectures = await (prisma as any).lecture.findMany({
          where: { subject: { module: { semesterId } } },
          select: { id: true }
        });
        const lectureIds = allSemesterLectures.map((l: any) => l.id);
        if (lectureIds.length > 0) {
          if (mediaType === "video") {
            await (prisma as any).lectureVideo.deleteMany({ where: { lectureId: { in: lectureIds } } });
          } else {
            await (prisma as any).lectureRecord.deleteMany({ where: { lectureId: { in: lectureIds } } });
          }
        }
      }

      let successCount = 0;
      for (const item of items) {
        let lectureId = item.matchedLectureId;

        // If no specific lecture is selected, create a new one
        if (!lectureId) {
          const lecture = await (prisma as any).lecture.create({
            data: {
              title: item.finalTitle || item.title,
              subjectId: item.matchedSubjectId,
              sortOrder: 0
            }
          });
          lectureId = lecture.id;
        }

        if (mediaType === "video") {
          await (prisma as any).lectureVideo.create({
            data: {
              title: item.title,
              url: item.url,
              lectureId: lectureId,
              sourceType: item.originalSource || "youtube"
            }
          });
        } else {
          await (prisma as any).lectureRecord.create({
            data: {
              title: item.title,
              url: item.url,
              lectureId: lectureId,
              sourceType: item.originalSource || "spotify"
            }
          });
        }
        successCount++;
      }

      if (autoSync) {
        try {
          await (prisma as any).playlistSyncTask.create({
            data: { playlistUrl, semesterId, mediaType, editionYear: editionYear || null }
          });
        } catch (e) { console.log("Auto-sync save failed:", e); }
      }

      return NextResponse.json({ success: true, message: `Successfully synced ${successCount} items.` });
    }

    // Handle PREVIEW
    if (!playlistUrl || !semesterId || !action || !mediaType) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    const isYouTube = playlistUrl.includes("youtube.com") || playlistUrl.includes("youtu.be");
    const isSpotify = playlistUrl.includes("spotify.com");

    let itemsToSync: any[] = [];
    if (isYouTube) {
      const apiKey = process.env.YOUTUBE_API_KEY;
      let playlistId = playlistUrl.includes("list=") ? playlistUrl.split("list=")[1].split("&")[0] : "";
      let nextPageToken = "";
      do {
        const res = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${playlistId}&key=${apiKey}${nextPageToken ? `&pageToken=${nextPageToken}` : ""}`);
        if (!res.ok) break;
        const data = await res.json();
        const newItems = data.items.map((item: any) => ({
          title: item.snippet.title,
          url: `https://www.youtube.com/watch?v=${item.snippet.resourceId.videoId}`,
          thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url,
          originalSource: "youtube"
        }));
        itemsToSync = [...itemsToSync, ...newItems];
        nextPageToken = data.nextPageToken;
      } while (nextPageToken);
    } else if (isSpotify) {
       // Spotify fetch logic...
       const clientId = process.env.SPOTIFY_CLIENT_ID;
       const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
       let playlistId = playlistUrl.includes("/playlist/") ? playlistUrl.split("/playlist/")[1].split("?")[0] : "";
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
             const tracksRes = await fetch(nextUrl, { headers: { "Authorization": `Bearer ${access_token}` } });
             if (!tracksRes.ok) break;
             const tracksData = await tracksRes.json();
             itemsToSync = [...itemsToSync, ...tracksData.items.map((item: any) => ({
               title: item.track.name,
               url: item.track.external_urls.spotify,
               thumbnail: item.track.album.images?.[0]?.url,
               originalSource: "spotify"
             }))];
             nextUrl = tracksData.next;
           } while (nextUrl);
         }
       }
    }

    const semester = await (prisma as any).semester.findUnique({
      where: { id: semesterId },
      include: { modules: { include: { subjects: { include: { lectures: true } } } } }
    });

    const subjects = semester?.modules.flatMap((m: any) => m.subjects.map((s: any) => ({
      id: s.id,
      name: s.name,
      moduleName: m.name,
      lectures: s.lectures.map((l: any) => ({ id: l.id, title: l.title }))
    }))) || [];

    const previewData = itemsToSync.map(item => {
      let matchedSubject = subjects.find((s: any) => item.title.toLowerCase().includes(s.name.toLowerCase()));
      if (!matchedSubject) return null;
      
      // Try to find a matching lecture title within that subject
      let matchedLecture = matchedSubject.lectures.find((l: any) => item.title.toLowerCase().includes(l.title.toLowerCase()));

      return {
        ...item,
        matchedSubjectId: matchedSubject.id,
        matchedSubjectName: matchedSubject.name,
        matchedModuleName: matchedSubject.moduleName,
        matchedLectureId: matchedLecture?.id || null,
        matchedLectureTitle: matchedLecture?.title || "Create New Lecture",
        finalTitle: `${item.title}${editionYear ? ` - ${editionYear}` : ""}`
      };
    }).filter(Boolean);

    if (action === "preview") {
      return NextResponse.json({ success: true, previewData, availableSubjects: subjects });
    }

    return NextResponse.json({ error: "Action Error" }, { status: 400 });
  } catch (error: any) {
    console.error("Sync Error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
