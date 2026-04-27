import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session || ((session.user as any).role !== "ADMIN" && (session.user as any).role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); // "youtube" or "spotify"

    let targetEntities: Array<{ id: string, url: string }> = [];

    if (type === "spotify") {
      // Find all Spotify audio records
      const spotifyRecords = await prisma.lectureRecord.findMany({
        where: {
          sourceType: "spotify",
          url: {
            contains: "spotify",
          },
        },
      });
      targetEntities = spotifyRecords.map((r: any) => ({ id: r.id, url: r.url }));
    } else {
      // Find all external YouTube videos (Default)
      const externalVideos = await prisma.lectureVideo.findMany({
        where: {
          sourceType: "external",
          url: {
            contains: "youtu",
          },
        },
      });
      targetEntities = externalVideos.map((v: any) => ({ id: v.id, url: v.url }));
    }

    let queuedCount = 0;

    for (const entity of targetEntities) {
      // Check if task already exists for this entity
      const existingTask = await prisma.youtubeUploadTask.findFirst({
        where: { entityId: entity.id },
      });

      if (!existingTask) {
        await prisma.youtubeUploadTask.create({
          data: {
            sourceUrl: entity.url,
            status: "PENDING",
            totalVideos: 1, // Single item
            entityId: entity.id,
          },
        });
        queuedCount++;
      }
    }

    return NextResponse.json({ 
      success: true, 
      queuedCount, 
      totalExternal: targetEntities.length 
    });

  } catch (error) {
    console.error("Error auto-queueing videos:", error);
    return NextResponse.json(
      { error: "Failed to auto-queue videos" },
      { status: 500 }
    );
  }
}
