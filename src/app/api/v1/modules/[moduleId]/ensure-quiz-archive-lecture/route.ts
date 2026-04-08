import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assertModule, requireAdminWriter } from "@/lib/admin-scope";

const ARCHIVE_LECTURE_TITLE = "— Quiz archive —";
const HOST_SUBJECT_NAME = "Quizzes";

/** Ensure an archive lecture to move removed quiz questions into (keeps attempts valid). */
export async function POST(
  _req: NextRequest,
  ctx: { params: Promise<{ moduleId: string }> | { moduleId: string } }
) {
  const session = await auth();
  const w = await requireAdminWriter(session);
  if (!w.ok) return w.response;

  const { moduleId } = await Promise.resolve(ctx.params);
  const boundary = await assertModule(w.scope, moduleId);
  if (boundary) return boundary;

  const subj =
    (await prisma.subject.findFirst({
      where: { moduleId, isQuizSystemBank: true },
      select: { id: true },
    })) ??
    (await prisma.subject.create({
      data: { moduleId, name: HOST_SUBJECT_NAME, isQuizSystemBank: true },
      select: { id: true },
    }));

  const existing = await prisma.lecture.findFirst({
    where: { subjectId: subj.id, title: ARCHIVE_LECTURE_TITLE },
    select: { id: true },
  });
  if (existing) return NextResponse.json({ lectureId: existing.id });

  const lecture = await prisma.lecture.create({
    data: { subjectId: subj.id, title: ARCHIVE_LECTURE_TITLE, order: 10_001 },
    select: { id: true },
  });
  return NextResponse.json({ lectureId: lecture.id }, { status: 201 });
}

