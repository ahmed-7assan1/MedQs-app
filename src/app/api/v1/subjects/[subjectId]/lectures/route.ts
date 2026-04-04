import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: { subjectId: string } }) {
  const lectures = await prisma.lecture.findMany({
    where: { subjectId: params.subjectId },
    orderBy: { order: "asc" },
    select: { id: true, title: true, videoUrl: true, subjectId: true, order: true },
  });
  return NextResponse.json(lectures);
}

export async function POST(req: NextRequest, { params }: { params: { subjectId: string } }) {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (role !== "ADMIN" && role !== "SUPER_ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { title, videoUrl, flashcards } = await req.json();
  if (!title?.trim()) return NextResponse.json({ error: "Title required" }, { status: 400 });

  // Count existing lectures for order
  const count = await prisma.lecture.count({ where: { subjectId: params.subjectId } });

  const lecture = await prisma.lecture.create({
    data: {
      title,
      videoUrl: videoUrl || undefined,
      subjectId: params.subjectId,
      order: count + 1,
      flashcards: flashcards?.length
        ? { create: flashcards.map((f: { front: string; back: string }) => ({ front: f.front, back: f.back })) }
        : undefined,
    },
    include: { flashcards: true },
  });

  return NextResponse.json(lecture, { status: 201 });
}
