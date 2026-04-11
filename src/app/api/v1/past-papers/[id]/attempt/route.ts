import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { loadQuestionAnswerKeysForPastPaper } from "@/lib/past-paper-quiz";
import { appendQuizResultRow } from "@/lib/sheets";
import { buildQuizAttemptItems } from "@/lib/quiz-attempt-items";
import { computeWeightedQuizPercent } from "@/lib/quiz-attempt-score";

// POST /api/v1/past-papers/:id/attempt
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { answers, timeTaken, focusLossCount } = await req.json();
  const loss =
    typeof focusLossCount === "number" && Number.isFinite(focusLossCount)
      ? Math.max(0, Math.min(10_000, Math.floor(focusLossCount)))
      : 0;

  const paper = await prisma.pastPaper.findUnique({
    where: { id: params.id },
    select: { id: true, title: true, googleSheetsSyncEnabled: true },
  });
  if (!paper) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const site = await prisma.siteConfig.findFirst({ select: { aiPreferredProvider: true } }).catch(() => null);
  const { aiOptionsFromSiteProvider } = await import("@/lib/site-ai-options");
  const aiOpts = aiOptionsFromSiteProvider(site?.aiPreferredProvider);

  const keys = await loadQuestionAnswerKeysForPastPaper(params.id);
  const items = await buildQuizAttemptItems(keys, answers, aiOpts);
  const score = computeWeightedQuizPercent(
    keys.map((k) => ({ id: k.id, questionType: k.questionType })),
    items
  );

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

  if (paper.googleSheetsSyncEnabled) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { name: true, email: true },
      });
      await appendQuizResultRow({
        timestamp: new Date().toISOString(),
        paperId: paper.id,
        paperTitle: paper.title,
        studentName: user?.name ?? "",
        email: user?.email ?? "",
        score,
        total: keys.length,
        timeSeconds: typeof timeTaken === "number" && Number.isFinite(timeTaken) ? Math.max(0, Math.floor(timeTaken)) : 0,
      });
    } catch (e) {
      console.warn("[past-papers/attempt] Google Sheets append skipped:", e);
    }
  }

  return NextResponse.json({ attemptId: attempt.id, score, total: keys.length }, { status: 201 });
}
