import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await auth();
  const userId = session?.user?.id;

  if (userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { semesterId: true },
    });

    if (user?.semesterId) {
      const semesterFlashcards = await prisma.flashcard.findMany({
        where: {
          lecture: {
            subject: { semesterId: user.semesterId },
          },
        },
        select: {
          id: true,
          front: true,
          back: true,
          lectureId: true,
          lecture: {
            select: {
              title: true,
              subject: { select: { name: true, id: true } },
            },
          },
        },
      });

      if (semesterFlashcards.length > 0) {
        const progress = await prisma.userFlashcardProgress.findMany({
          where: {
            userId,
            flashcardId: { in: semesterFlashcards.map((f) => f.id) },
          },
        });

        const progressMap = new Map(progress.map((p) => [p.flashcardId, p]));

        // Compute subject-level weakness (avg rating per subject)
        const subjectRatings = new Map<string, number[]>();
        for (const fc of semesterFlashcards) {
          const subjId = fc.lecture.subject.id;
          const p = progressMap.get(fc.id);
          if (p?.lastRating != null) {
            const ratings = subjectRatings.get(subjId) || [];
            ratings.push(p.lastRating);
            subjectRatings.set(subjId, ratings);
          }
        }
        const subjectAvg = new Map<string, number>();
        for (const [subjId, ratings] of subjectRatings) {
          subjectAvg.set(subjId, ratings.reduce((a, b) => a + b, 0) / ratings.length);
        }

        const scored = semesterFlashcards.map((fc) => {
          const p = progressMap.get(fc.id);
          const avgSubj = subjectAvg.get(fc.lecture.subject.id) ?? 3;
          let score = 0;

          if (!p) {
            // Never reviewed — pull from weaker subjects first
            score = 40 + (1 - avgSubj / 5) * 20 + Math.random() * 10;
          } else if (p.lastRating != null && p.lastRating < 3) {
            // Wrong card — highest priority, weaker subjects get even higher
            score = (1 - p.lastRating / 3) * 15 + (1 - avgSubj / 5) * 10 + Math.random() * 5;
          } else if (p.repetitions <= 2) {
            // Low repetitions — medium priority
            score = 30 + (1 - avgSubj / 5) * 15 + Math.random() * 10;
          } else {
            // Well-known — lowest priority
            score = 70 + Math.random() * 30;
          }

          return { flashcard: fc, progress: p, score };
        });

        scored.sort((a, b) => a.score - b.score);
        const top = scored.slice(0, 10);

        const cards = top.map(({ flashcard: fc, progress: p }) => ({
          id: fc.id,
          front: fc.front,
          back: fc.back,
          lectureTitle: fc.lecture.title,
          subjectName: fc.lecture.subject.name,
          lastRating: p?.lastRating ?? null,
          repetitions: p?.repetitions ?? 0,
          easeFactor: p?.easeFactor ?? 2.5,
          interval: p?.interval ?? 0,
          lastReviewedAt: p?.lastReviewedAt ?? null,
          nextReviewAt: p?.nextReviewAt?.toISOString() ?? new Date().toISOString(),
          wrong: p?.lastRating != null && p.lastRating < 3,
        }));

        return NextResponse.json(cards);
      }
    }
  }

  // Fallback: random flashcards from entire pool (no auth / empty semester)
  const totalCount = await prisma.flashcard.count();
  if (totalCount === 0) {
    return NextResponse.json([]);
  }

  const randomSkip = totalCount > 10
    ? Math.max(0, Math.floor(Math.random() * (totalCount - 10)))
    : 0;

  const randomCards = await prisma.flashcard.findMany({
    skip: randomSkip,
    take: 10,
    include: {
      lecture: { select: { title: true, subject: { select: { name: true } } } },
    },
    orderBy: { id: "asc" },
  });

  const cards = randomCards.map((fc) => ({
    id: fc.id,
    front: fc.front,
    back: fc.back,
    lectureTitle: fc.lecture.title,
    subjectName: fc.lecture.subject.name,
    lastRating: null,
    repetitions: 0,
    easeFactor: 2.5,
    interval: 0,
    lastReviewedAt: null,
    nextReviewAt: new Date().toISOString(),
    wrong: false,
    from: "random",
  }));

  return NextResponse.json(cards);
}
