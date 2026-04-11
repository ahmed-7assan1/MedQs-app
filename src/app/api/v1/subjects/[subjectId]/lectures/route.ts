import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assertSubject, requireAdminWriter } from "@/lib/admin-scope";
import { getSessionScope, isSuperAdmin } from "@/lib/tenant";

export async function GET(req: NextRequest, { params }: { params: { subjectId: string } }) {
  const session = await auth();
  const scope = await getSessionScope(session);
  if (!scope) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isSuperAdmin(scope.role) && !scope.universityId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (!isSuperAdmin(scope.role)) {
    const subjErr = await assertSubject(scope as any, params.subjectId);
    if (subjErr) return subjErr;
  }

  const lectures = await prisma.lecture.findMany({
    where: { subjectId: params.subjectId },
    orderBy: { order: "asc" },
    select: { id: true, title: true, videoUrl: true, subjectId: true, order: true },
  });
  return NextResponse.json(lectures);
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ subjectId: string }> | { subjectId: string } }
) {
  const session = await auth();
  const w = await requireAdminWriter(session);
  if (!w.ok) return w.response;
  const { subjectId } = await Promise.resolve(ctx.params);
  const boundary = await assertSubject(w.scope, subjectId);
  if (boundary) return boundary;

  const { title, videoUrl, flashcards } = await req.json();
  if (!title?.trim()) return NextResponse.json({ error: "Title required" }, { status: 400 });

  // Count existing lectures for order
  const count = await prisma.lecture.count({ where: { subjectId } });

  const lecture = await prisma.lecture.create({
    data: {
      title,
      videoUrl: videoUrl || undefined,
      subjectId,
      order: count + 1,
      flashcards: flashcards?.length
        ? { create: flashcards.map((f: { front: string; back: string }) => ({ front: f.front, back: f.back })) }
        : undefined,
    },
    include: { flashcards: true },
  });

  return NextResponse.json(lecture, { status: 201 });
}
