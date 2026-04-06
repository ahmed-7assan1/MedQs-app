import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assertLecture, requireAdminWriter } from "@/lib/admin-scope";

export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> | { id: string } }
) {
  const session = await auth();
  const w = await requireAdminWriter(session);
  if (!w.ok) return w.response;
  const { id } = await Promise.resolve(ctx.params);
  const boundary = await assertLecture(w.scope, id);
  if (boundary) return boundary;

  await prisma.lecture.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> | { id: string } }) {
  const { id } = await Promise.resolve(ctx.params);
  const lecture = await prisma.lecture.findUnique({
    where: { id },
    include: {
      flashcards: true,
      questions: { select: { id: true, body: true, difficulty: true, answer: true, choices: true } },
      files: true,
      videos: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] },
    },
  });
  if (!lecture) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(lecture);
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> | { id: string } }) {
  const session = await auth();
  const w = await requireAdminWriter(session);
  if (!w.ok) return w.response;
  const { id } = await Promise.resolve(ctx.params);
  const boundary = await assertLecture(w.scope, id);
  if (boundary) return boundary;

  const body = await req.json().catch(() => ({}));
  const data: { title?: string; videoUrl?: string | null; notesMarkdown?: string | null } = {};
  if (typeof body.title === "string" && body.title.trim()) data.title = body.title.trim();
  if (body.videoUrl === null || typeof body.videoUrl === "string") data.videoUrl = body.videoUrl?.trim() || null;
  if (typeof body.notesMarkdown === "string") data.notesMarkdown = body.notesMarkdown;

  if (Object.keys(data).length === 0)
    return NextResponse.json({ error: "No valid fields" }, { status: 400 });

  const lecture = await prisma.lecture.update({
    where: { id },
    data,
  });
  return NextResponse.json(lecture);
}
