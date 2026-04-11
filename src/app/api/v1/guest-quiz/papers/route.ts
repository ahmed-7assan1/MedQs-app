import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { GUEST_QUIZ_COOKIE } from "@/lib/guest-quiz";

export async function GET(req: NextRequest) {
  const guestId = req.cookies.get(GUEST_QUIZ_COOKIE)?.value?.trim();
  if (!guestId) return NextResponse.json({ error: "Guest session required" }, { status: 401 });

  const guest = await prisma.guestQuizUser.findUnique({
    where: { id: guestId },
    select: { id: true },
  });
  if (!guest) return NextResponse.json({ error: "Invalid guest session" }, { status: 401 });

  const papers = await prisma.pastPaper.findMany({
    orderBy: { createdAt: "desc" },
    take: 300,
    select: {
      id: true,
      title: true,
      timeLimitMin: true,
      isInteractive: true,
      kind: true,
      module: { select: { name: true } },
    },
  });

  const attempts = await prisma.quizAttempt.findMany({
    where: { guestQuizUserId: guestId },
    select: { pastPaperId: true, score: true, id: true },
  });
  const bestByPaper = new Map<string, { score: number; attemptId: string }>();
  for (const a of attempts) {
    const cur = bestByPaper.get(a.pastPaperId);
    if (!cur || a.score > cur.score) {
      bestByPaper.set(a.pastPaperId, { score: a.score, attemptId: a.id });
    }
  }

  const payload = papers.map((p) => ({
    ...p,
    bestScore: bestByPaper.get(p.id)?.score,
    lastAttemptId: bestByPaper.get(p.id)?.attemptId,
  }));

  return NextResponse.json(payload);
}
