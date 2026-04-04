import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/v1/past-papers/:id/attempt
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { answers, timeTaken, focusLossCount } = await req.json();
  const loss =
    typeof focusLossCount === "number" && Number.isFinite(focusLossCount)
      ? Math.max(0, Math.min(10_000, Math.floor(focusLossCount)))
      : 0;
  // answers: { [questionId]: chosenKey }

  const paper = await prisma.pastPaper.findUnique({
    where: { id: params.id },
    include: { attempts: { where: { userId: session.user.id } } },
  });
  if (!paper) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Get questions for this paper's module
  const questions = await prisma.question.findMany({
    where: { lecture: { subject: { moduleId: paper.moduleId } } },
    select: { id: true, answer: true },
  });

  const items = questions.map((q) => ({
    questionId: q.id,
    chosen: answers[q.id] ?? "",
    isCorrect: answers[q.id] === q.answer,
  }));

  const score = questions.length > 0
    ? Math.round((items.filter((i) => i.isCorrect).length / questions.length) * 100)
    : 0;

  const attempt = await prisma.quizAttempt.create({
    data: {
      userId: session.user.id,
      pastPaperId: params.id,
      score,
      timeTaken: timeTaken ?? 0,
      focusLossCount: loss,
      items: { create: items },
    },
    include: { items: true },
  });

  return NextResponse.json({ attemptId: attempt.id, score, total: questions.length }, { status: 201 });
}
