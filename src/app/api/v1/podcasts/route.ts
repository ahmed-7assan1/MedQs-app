import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(50, Math.max(4, Number(searchParams.get("limit") ?? 12)));
  const skip = (page - 1) * limit;

  try {
    const [records, total] = await Promise.all([
      prisma.lectureRecord.findMany({
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          lecture: {
            include: {
              subject: {
                include: {
                  module: true
                }
              }
            }
          }
        }
      }),
      prisma.lectureRecord.count()
    ]);

    const formattedRecords = await Promise.all(records.map(async (r: any) => {
      const isSpotify = r.url.includes("spotify.com");
      let spotifyData = null;

      if (isSpotify) {
        try {
          const { getSpotifyMetadata } = await import("@/lib/spotify");
          spotifyData = await getSpotifyMetadata(r.url);
        } catch (e) {
          console.error("Spotify meta error:", e);
        }
      }

      return {
        id: r.id,
        title: spotifyData?.title || r.title,
        url: r.url,
        sourceType: r.sourceType,
        image: spotifyData?.image || null,
        artist: spotifyData?.artist || "MedOneX Audio",
        createdAt: r.createdAt.toISOString(),
        lecture: {
          id: r.lecture.id,
          title: r.lecture.title,
          subject: {
            name: r.lecture.subject.name,
            module: {
              name: r.lecture.subject.module.name
            }
          }
        }
      };
    }));

    return NextResponse.json({
      items: formattedRecords,
      total,
      page,
      hasMore: skip + records.length < total
    }, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      }
    });
  } catch (error) {
    console.error("Podcasts API Error:", error);
    return NextResponse.json({ error: "Failed to fetch podcasts" }, { status: 500 });
  }
}
