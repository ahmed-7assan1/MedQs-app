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
    where: { videoId: targetVideoId }, // prioritize direct video relationship
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      content: true,
      videoId: true,
      userId: true,
      parentId: true,
      createdAt: true,
      user: { select: { id: true, name: true, nickname: true, image: true } },
    }
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

  const parentId = typeof body?.parentId === "string" ? body.parentId : null;

  try {
    const row = await prisma.lectureVideoComment.create({
      data: { 
        videoId: targetVideoId, 
        userId, 
        content: content.slice(0, 1000),
        // Use direct scalar field to bypass relation metadata issues
        parentId: parentId || undefined
      },
      include: { user: { select: { id: true, name: true, nickname: true, image: true } } },
    });
    
    await prisma.lectureVideo.update({
      where: { id: targetVideoId },
      data: { commentsCount: { increment: 1 } },
    });
    
    return NextResponse.json(row, { status: 201 });
  } catch (err: any) {
    console.error("Comment Create Error:", err);
    return NextResponse.json({ 
      error: `Failed: ${err.message || "Unknown Prisma Error"}` 
    }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; videoId: string } }
) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const commentId = searchParams.get("commentId");
  if (!commentId) return NextResponse.json({ error: "Comment ID required" }, { status: 400 });

  const comment = await prisma.lectureVideoComment.findUnique({
    where: { id: commentId },
    select: { userId: true, videoId: true }
  });

  if (!comment) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Only author can delete
  if (comment.userId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.lectureVideoComment.delete({
    where: { id: commentId }
  });

  await prisma.lectureVideo.update({
    where: { id: comment.videoId },
    data: { commentsCount: { decrement: 1 } }
  });

  return NextResponse.json({ success: true });
}

