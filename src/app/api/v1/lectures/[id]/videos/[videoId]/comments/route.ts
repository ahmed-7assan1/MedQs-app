import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string; videoId: string } }
) {
  let targetVideoId = params.videoId;
  if (targetVideoId === "legacy-single") {
    const lecture = await prisma.lecture.findUnique({ where: { id: params.id } });
    if (!lecture || !lecture.videoUrl) return NextResponse.json([]);
    let lv = await prisma.lectureVideo.findFirst({ where: { lectureId: params.id, url: lecture.videoUrl } });
    if (!lv) lv = await prisma.lectureVideo.create({ data: { title: "Main lecture video", url: lecture.videoUrl, lectureId: params.id } });
    targetVideoId = lv.id;
  }

  const comments = await prisma.lectureVideoComment.findMany({
    where: { videoId: targetVideoId, video: { lectureId: params.id } },
    orderBy: { createdAt: "asc" },
    include: {
      user: { select: { id: true, name: true, nickname: true, image: true } },
    },
  });
  return NextResponse.json(comments);
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string; videoId: string } }
) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const content = typeof body?.content === "string" ? body.content.trim() : "";
  if (!content) return NextResponse.json({ error: "Comment cannot be empty" }, { status: 400 });

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

  const row = await prisma.lectureVideoComment.create({
    data: { videoId: targetVideoId, userId, content: content.slice(0, 1000) },
    include: { user: { select: { id: true, name: true, nickname: true, image: true } } },
  });
  await prisma.lectureVideo.update({
    where: { id: targetVideoId },
    data: { commentsCount: { increment: 1 } },
  });
  return NextResponse.json(row, { status: 201 });
}

