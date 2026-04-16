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

  let targetVideoId = params.videoId;
  if (targetVideoId === "legacy-single") {
    const lecture = await prisma.lecture.findUnique({ where: { id: params.id } });
    if (!lecture || !lecture.videoUrl) return NextResponse.json({ error: "Video not found" }, { status: 404 });
    let lv = await prisma.lectureVideo.findFirst({ where: { lectureId: params.id, url: lecture.videoUrl } });
    if (!lv) lv = await prisma.lectureVideo.create({ data: { title: "Main lecture video", url: lecture.videoUrl, lectureId: params.id } });
    targetVideoId = lv.id;
  }

  const video = await prisma.lectureVideo.findFirst({
    where: { id: targetVideoId, lectureId: params.id },
    select: { id: true },
  });
  if (!video) return NextResponse.json({ error: "Video not found" }, { status: 404 });

  const existing = await prisma.lectureVideoLike.findUnique({
    where: { videoId_userId: { videoId: targetVideoId, userId } },
  });
  if (existing) {
    await prisma.lectureVideoLike.delete({ where: { id: existing.id } });
    await prisma.lectureVideo.update({
      where: { id: targetVideoId },
      data: { likesCount: { decrement: 1 } },
    });
    return NextResponse.json({ liked: false });
  }

  await prisma.lectureVideoLike.create({ data: { videoId: targetVideoId, userId } });
  await prisma.lectureVideo.update({
    where: { id: targetVideoId },
    data: { likesCount: { increment: 1 } },
  });
  return NextResponse.json({ liked: true });
}

