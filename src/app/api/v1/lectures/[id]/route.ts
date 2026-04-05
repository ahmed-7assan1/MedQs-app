import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (role !== "ADMIN" && role !== "SUPER_ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.lecture.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const lecture = await prisma.lecture.findUnique({
    where: { id: params.id },
    include: {
      flashcards: true,
      questions: { select: { id: true, body: true, difficulty: true, answer: true, choices: true } },
      files: true,
    },
  });
  if (!lecture) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(lecture);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (role !== "ADMIN" && role !== "SUPER_ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const data: { title?: string; videoUrl?: string | null; notesMarkdown?: string | null } = {};
  if (typeof body.title === "string" && body.title.trim()) data.title = body.title.trim();
  if (body.videoUrl === null || typeof body.videoUrl === "string") data.videoUrl = body.videoUrl?.trim() || null;
  if (typeof body.notesMarkdown === "string") data.notesMarkdown = body.notesMarkdown;

  if (Object.keys(data).length === 0)
    return NextResponse.json({ error: "No valid fields" }, { status: 400 });

  const lecture = await prisma.lecture.update({
    where: { id: params.id },
    data,
  });
  return NextResponse.json(lecture);
}
