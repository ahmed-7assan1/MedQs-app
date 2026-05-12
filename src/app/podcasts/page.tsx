import { prisma } from "@/lib/prisma";
import { PodcastsClient } from "@/components/podcasts/PodcastsClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Podcasts | MedOneX Audio Library",
  description: "Listen to professional medical lectures and discussions on the go with the MedOneX Audio Hub.",
};

export const dynamic = "force-dynamic";

export default async function PodcastsPage() {
  // Initial fetch for Page 1 only (Server-side for SEO and fast first paint)
  const limit = 12;
  const [records, total] = await Promise.all([
    prisma.lectureRecord.findMany({
      orderBy: { createdAt: "desc" },
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
      } catch (e) {}
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

  return (
    <PodcastsClient 
      initialRecords={formattedRecords} 
      initialHasMore={records.length < total}
    />
  );
}
