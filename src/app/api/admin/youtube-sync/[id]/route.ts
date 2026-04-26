import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    
    const { status, progress, totalVideos, syncedVideos, error, newVideoUrl, entityId } = body;

    const data: any = {};
    if (status) data.status = status;
    if (typeof progress === "number") data.progress = progress;
    if (typeof totalVideos === "number") data.totalVideos = totalVideos;
    if (typeof syncedVideos === "number") data.syncedVideos = syncedVideos;
    if (error !== undefined) data.error = error;
    if (newVideoUrl !== undefined) data.newVideoUrl = newVideoUrl;
    if (entityId !== undefined) data.entityId = entityId;

    const updatedTask = await prisma.youtubeUploadTask.update({
      where: { id },
      data,
    });

    // --- AUTO-MIGRATION LOGIC ---
    // If completed and we have a newVideoUrl and an entityId, we replace the link in LectureVideo
    if (status === "COMPLETED" || (updatedTask.status === "COMPLETED" && newVideoUrl && updatedTask.entityId)) {
      const finalUrl = newVideoUrl || updatedTask.newVideoUrl;
      const targetEntityId = entityId || updatedTask.entityId;

      if (finalUrl && targetEntityId) {
        try {
          await prisma.lectureVideo.update({
            where: { id: targetEntityId },
            data: {
              url: finalUrl,
              sourceType: "internal_youtube", // Mark it as migrated
            },
          });
          console.log(`[Auto-Migrate] Swapped URL for LectureVideo ${targetEntityId} to ${finalUrl}`);
        } catch (err) {
          console.error(`[Auto-Migrate] Failed to update LectureVideo ${targetEntityId}:`, err);
        }
      }
    }

    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error("Error updating sync task:", error);
    return NextResponse.json(
      { error: "Failed to update sync task" },
      { status: 500 }
    );
  }
}
