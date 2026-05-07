
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || "PENDING";

  const tasks = await prisma.telegramMigrationTask.findMany({
    where: { status },
    orderBy: { createdAt: "asc" },
    take: 5
  });

  return NextResponse.json(tasks);
}

export async function PATCH(req: NextRequest) {
  const { id, status, telegramMessageId, telegramChatId, error, progress } = await req.json();

  const task = await prisma.telegramMigrationTask.update({
    where: { id },
    data: {
      status,
      telegramMessageId,
      telegramChatId,
      error,
      progress,
      updatedAt: new Date()
    }
  });

  // If completed, update the corresponding LectureVideo
  if (status === "COMPLETED" && task.lectureVideoId && telegramMessageId) {
    await prisma.lectureVideo.update({
      where: { id: task.lectureVideoId },
      data: {
        telegramMessageId,
        telegramChatId
      }
    }).catch(err => console.error("Failed to sync migration result to LectureVideo:", err));
  }

  return NextResponse.json(task);
}
