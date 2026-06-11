import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { loadQuestionAnswerKeysForPastPaper } from "@/lib/past-paper-quiz";
import { appendQuizResultRow } from "@/lib/sheets";
import { GUEST_QUIZ_COOKIE } from "@/lib/guest-quiz";
import { buildQuizAttemptItems } from "@/lib/quiz-attempt-items";
import { computeWeightedQuizPercent } from "@/lib/quiz-attempt-score";

// POST /api/v1/guest-quiz/past-papers/:id/attempt
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> | { id: string } }) {
  const guestId = req.cookies.get(GUEST_QUIZ_COOKIE)?.value?.trim();
  if (!guestId) return NextResponse.json({ error: "Guest session required" }, { status: 401 });

  const guest = await prisma.guestQuizUser.findUnique({
    where: { id: guestId },
    select: { id: true, displayName: true, externalStudentId: true },
  });
  if (!guest) return NextResponse.json({ error: "Invalid guest session" }, { status: 401 });

  const { id: pastPaperId } = await Promise.resolve(ctx.params);

  const { answers, timeTaken, focusLossCount } = await req.json().catch(() => ({}));
  const loss =
    typeof focusLossCount === "number" && Number.isFinite(focusLossCount)
      ? Math.max(0, Math.min(10_000, Math.floor(focusLossCount)))
      : 0;

  const paper = await prisma.pastPaper.findUnique({
    where: { id: pastPaperId },
    select: { id: true, title: true, googleSheetsSyncEnabled: true },
  });
  if (!paper) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { getSiteConfig: getCfg } = await import("@/lib/get-site-config");
  const site = await getCfg().catch(() => null);
  const { aiOptionsFromSiteProvider } = await import("@/lib/site-ai-options");
  const aiOpts = aiOptionsFromSiteProvider(site?.aiPreferredProvider);

  const keys = await loadQuestionAnswerKeysForPastPaper(pastPaperId);
  const items = await buildQuizAttemptItems(keys, answers, aiOpts);
  const score = computeWeightedQuizPercent(
    keys.map((k) => ({ id: k.id, questionType: k.questionType })),
    items
  );

  const attempt = await prisma.quizAttempt.create({
    data: {
      guestQuizUserId: guest.id,
      pastPaperId,
      score,
      timeTaken: timeTaken ?? 0,
      focusLossCount: loss,
      items: { create: items },
    },
    include: { items: true },
  });

  if (paper.googleSheetsSyncEnabled) {
    try {
      await appendQuizResultRow({
        timestamp: new Date().toISOString(),
        paperId: paper.id,
        paperTitle: paper.title,
        studentName: `${guest.displayName} (guest ${guest.externalStudentId})`,
        email: "",
        score,
        total: keys.length,
        timeSeconds: typeof timeTaken === "number" && Number.isFinite(timeTaken) ? Math.max(0, Math.floor(timeTaken)) : 0,
      });
    } catch (e) {
      console.warn("[guest-quiz/attempt] Google Sheets append skipped:", e);
    }
  }

  return NextResponse.json({ attemptId: attempt.id, score, total: keys.length }, { status: 201 });
}
