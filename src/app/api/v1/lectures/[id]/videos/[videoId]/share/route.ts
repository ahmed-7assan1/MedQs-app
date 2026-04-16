import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string; videoId: string } }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
    select: { id: true, sharingEnabled: true, sharesCount: true },
  });
  if (!video) return NextResponse.json({ error: "Video not found" }, { status: 404 });
  if (!video.sharingEnabled) return NextResponse.json({ error: "Sharing is disabled for this video" }, { status: 403 });

  const updated = await prisma.lectureVideo.update({
    where: { id: targetVideoId },
    data: { sharesCount: { increment: 1 } },
    select: { sharesCount: true },
  });
  return NextResponse.json({ shared: true, sharesCount: updated.sharesCount });
}

