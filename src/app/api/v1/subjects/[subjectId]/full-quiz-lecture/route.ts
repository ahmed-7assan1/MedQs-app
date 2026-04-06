import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assertSubject, requireAdminWriter } from "@/lib/admin-scope";

/** One lecture per subject for “entire subject” AI / bulk questions (visible in curriculum like any lecture). */
const FULL_SUBJECT_QUIZ_LECTURE_TITLE = "— Full subject quiz | كويز كامل للمادة —";

export async function POST(
  _req: NextRequest,
  ctx: { params: Promise<{ subjectId: string }> | { subjectId: string } }
) {
  const session = await auth();
  const w = await requireAdminWriter(session);
  if (!w.ok) return w.response;
  const raw = await Promise.resolve(ctx.params);
  const subjectId = raw.subjectId?.trim();
  if (!subjectId) return NextResponse.json({ error: "Missing subject" }, { status: 400 });

  const boundary = await assertSubject(w.scope, subjectId);
  if (boundary) return boundary;

  const subject = await prisma.subject.findUnique({
    where: { id: subjectId },
    select: { id: true },
  });
  if (!subject) return NextResponse.json({ error: "Subject not found" }, { status: 404 });

  const existing = await prisma.lecture.findFirst({
    where: { subjectId, title: FULL_SUBJECT_QUIZ_LECTURE_TITLE },
    select: { id: true, title: true, order: true },
  });
  if (existing) return NextResponse.json({ lecture: existing });

  const agg = await prisma.lecture.aggregate({
    where: { subjectId },
    _max: { order: true },
  });
  const order = (agg._max.order ?? 0) + 1;

  const lecture = await prisma.lecture.create({
    data: {
      title: FULL_SUBJECT_QUIZ_LECTURE_TITLE,
      subjectId,
      order,
    },
    select: { id: true, title: true, order: true },
  });

  return NextResponse.json({ lecture }, { status: 201 });
}
