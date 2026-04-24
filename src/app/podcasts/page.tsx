import { prisma } from "@/lib/prisma";
import { PodcastsClient } from "@/components/podcasts/PodcastsClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Podcasts | MedQs Audio Library",
  description: "Listen to professional medical lectures and discussions on the go with the MedQs Audio Hub.",
};

export const dynamic = "force-dynamic";

export default async function PodcastsPage() {
  const records = await prisma.lectureRecord.findMany({
    orderBy: { createdAt: "desc" },
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
  });

  // Transform for the client component and fetch metadata if needed
  const formattedRecords = await Promise.all(records.map(async (r: any) => {
    const isSpotify = r.url.includes("spotify.com");
    let spotifyData = null;

    if (isSpotify) {
      // Import on demand to avoid client-side bundling issues in server component if any
      const { getSpotifyMetadata } = await import("@/lib/spotify");
      spotifyData = await getSpotifyMetadata(r.url);
    }

    return {
      id: r.id,
      title: spotifyData?.title || r.title,
      url: r.url,
      sourceType: r.sourceType,
      image: spotifyData?.image || null,
      artist: spotifyData?.artist || "MedQs Audio",
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

  return <PodcastsClient records={formattedRecords} />;
}
