import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string; videoId: string } }
) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const video = await prisma.lectureVideo.findFirst({
    where: { id: params.videoId, lectureId: params.id },
    select: { id: true },
  });
  if (!video) return NextResponse.json({ error: "Video not found" }, { status: 404 });

  const existing = await prisma.lectureVideoLike.findUnique({
    where: { videoId_userId: { videoId: params.videoId, userId } },
  });
  if (existing) {
    await prisma.lectureVideoLike.delete({ where: { id: existing.id } });
    await prisma.lectureVideo.update({
      where: { id: params.videoId },
      data: { likesCount: { decrement: 1 } },
    });
    return NextResponse.json({ liked: false });
  }

  await prisma.lectureVideoLike.create({ data: { videoId: params.videoId, userId } });
  await prisma.lectureVideo.update({
    where: { id: params.videoId },
    data: { likesCount: { increment: 1 } },
  });
  return NextResponse.json({ liked: true });
}

