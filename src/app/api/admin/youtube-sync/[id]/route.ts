import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const { id } = await Promise.resolve(params);
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
          // Try to update LectureVideo first
          let updatedVideo = false;
          try {
            const videoUpdate = await prisma.lectureVideo.updateMany({
              where: { id: targetEntityId },
              data: {
                url: finalUrl,
                sourceType: "internal_youtube", // Mark it as migrated
              },
            });
            if (videoUpdate.count > 0) {
              updatedVideo = true;
              console.log(`[Auto-Migrate] Swapped URL for LectureVideo ${targetEntityId} to ${finalUrl}`);
            }
          } catch (e) {
            // Ignore error, we will try LectureRecord
          }

          // If not a LectureVideo, try LectureRecord
          if (!updatedVideo) {
            const recordUpdate = await prisma.lectureRecord.updateMany({
              where: { id: targetEntityId },
              data: {
                url: finalUrl,
                sourceType: "internal_youtube_music", // Mark as migrated Spotify record
              },
            });
            if (recordUpdate.count > 0) {
              console.log(`[Auto-Migrate] Swapped URL for LectureRecord ${targetEntityId} to ${finalUrl}`);
            } else {
              console.warn(`[Auto-Migrate] Target entity ${targetEntityId} not found in LectureVideo or LectureRecord.`);
            }
          }
        } catch (err) {
          console.error(`[Auto-Migrate] Failed to update entity ${targetEntityId}:`, err);
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
