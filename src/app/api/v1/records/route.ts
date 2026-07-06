import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await auth();
  const semesterId = (session?.user as any)?.semesterId;

  if (!semesterId) {
    return NextResponse.json({ message: "Please complete onboarding to see records." }, { status: 400 });
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

    const [records, total] = await Promise.all([
      prisma.lectureRecord.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
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
      }),
      prisma.lectureRecord.count({ where })
    ]);

    const formatted = await Promise.all(records.map(async (r: any) => {
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
        url: r.url,
        title: spotifyData?.title || r.title,
        image: spotifyData?.image || null,
        artist: spotifyData?.artist || "MedOneX Audio",
        lectureId: r.lecture.id,
        lectureTitle: r.lecture.title,
        moduleId: r.lecture.subject.moduleId,
        subjectName: r.lecture.subject.name
      };
    }));

    return NextResponse.json({
      items: formatted,
      total,
      page,
      hasMore: skip + records.length < total
    }, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    console.error("Records API Error:", error);
    return NextResponse.json({ error: "Failed to fetch records" }, { status: 500 });
  }
}
