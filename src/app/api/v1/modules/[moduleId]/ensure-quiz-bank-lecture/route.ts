import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assertModule, requireAdminWriter } from "@/lib/admin-scope";

const BANK_SUBJECT_NAME = "Quiz question bank";
const BANK_LECTURE_TITLE = "— Quiz bank —";

/** Ensures one `isQuizSystemBank` subject + default lecture for storing quiz-creator questions. */
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

  let subject = await prisma.subject.findFirst({
    where: { moduleId, isQuizSystemBank: true },
    select: { id: true },
  });
  if (!subject) {
    subject = await prisma.subject.create({
      data: { moduleId, name: BANK_SUBJECT_NAME, isQuizSystemBank: true },
      select: { id: true },
    });
  }

  let lecture = await prisma.lecture.findFirst({
    where: { subjectId: subject.id, title: BANK_LECTURE_TITLE },
    select: { id: true },
  });
  if (!lecture) {
    const agg = await prisma.lecture.aggregate({
      where: { subjectId: subject.id },
      _max: { order: true },
    });
    const order = (agg._max.order ?? 0) + 1;
    lecture = await prisma.lecture.create({
      data: { subjectId: subject.id, title: BANK_LECTURE_TITLE, order },
      select: { id: true },
    });
  }

  return NextResponse.json({ lectureId: lecture.id, subjectId: subject.id });
}
