import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assertLectureIdsInScope, requireAdminWriter } from "@/lib/admin-scope";

export async function POST(req: NextRequest) {
  const session = await auth();
  const w = await requireAdminWriter(session);
  if (!w.ok) return w.response;

  const { questions } = await req.json();
  if (!Array.isArray(questions) || questions.length === 0)
    return NextResponse.json({ error: "No questions provided" }, { status: 400 });

  const lectureIds = questions.map((q: { lectureId?: string }) => q.lectureId).filter(Boolean) as string[];
  const boundary = await assertLectureIdsInScope(w.scope, lectureIds);
  if (boundary) return boundary;

  const created = await prisma.question.createMany({
    data: questions.map((q: any) => ({
      body: q.body,
      imageUrl: q.imageUrl ?? null,
      choices: q.choices,
      answer: q.answer,
      explanation: q.explanation,
      difficulty: q.difficulty ?? "MEDIUM",
      lectureId: q.lectureId,
    })),
    skipDuplicates: true,
  });

  return NextResponse.json({ count: created.count }, { status: 201 });
}
