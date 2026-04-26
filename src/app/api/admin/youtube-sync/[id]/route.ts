import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    
    const { status, progress, totalVideos, syncedVideos, error } = body;

    const data: any = {};
    if (status) data.status = status;
    if (typeof progress === "number") data.progress = progress;
    if (typeof totalVideos === "number") data.totalVideos = totalVideos;
    if (typeof syncedVideos === "number") data.syncedVideos = syncedVideos;
    if (error !== undefined) data.error = error;

    const updatedTask = await prisma.youtubeUploadTask.update({
      where: { id },
      data,
    });

    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error("Error updating sync task:", error);
    return NextResponse.json(
      { error: "Failed to update sync task" },
      { status: 500 }
    );
  }
}
