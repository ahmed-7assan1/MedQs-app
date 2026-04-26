import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find all external YouTube videos
    const externalVideos = await prisma.lectureVideo.findMany({
      where: {
        sourceType: "external",
        url: {
          contains: "youtu",
        },
      },
    });

    let queuedCount = 0;

    for (const video of externalVideos) {
      // Check if task already exists for this entity
      const existingTask = await prisma.youtubeUploadTask.findFirst({
        where: { entityId: video.id },
      });

      if (!existingTask) {
        await prisma.youtubeUploadTask.create({
          data: {
            sourceUrl: video.url,
            status: "PENDING",
            totalVideos: 1, // Single video
            entityId: video.id,
          },
        });
        queuedCount++;
      }
    }

    return NextResponse.json({ 
      success: true, 
      queuedCount, 
      totalExternal: externalVideos.length 
    });

  } catch (error) {
    console.error("Error auto-queueing videos:", error);
    return NextResponse.json(
      { error: "Failed to auto-queue videos" },
      { status: 500 }
    );
  }
}
