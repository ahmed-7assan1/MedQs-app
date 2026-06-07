import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await auth();
  const userId = session?.user?.id;

  // If user is authenticated, try reviewed cards first
  if (userId) {
    const reviewedCards = await prisma.userFlashcardProgress.findMany({
      where: { userId, repetitions: { gte: 1 } },
      include: {
        flashcard: {
          select: {
            id: true, front: true, back: true, lectureId: true,
            lecture: { select: { title: true, subject: { select: { name: true } } } },
          },
        },
      },
      orderBy: { lastReviewedAt: "desc" },
      take: 10,
    });

    if (reviewedCards.length > 0) {
      const cards = reviewedCards.map((p) => ({
        id: p.flashcard.id,
        front: p.flashcard.front,
        back: p.flashcard.back,
        lectureTitle: p.flashcard.lecture.title,
        subjectName: p.flashcard.lecture.subject.name,
        lastRating: p.lastRating,
        repetitions: p.repetitions,
        easeFactor: p.easeFactor,
        interval: p.interval,
        lastReviewedAt: p.lastReviewedAt,
        nextReviewAt: p.nextReviewAt,
        wrong: p.lastRating != null && p.lastRating < 3,
      }));
      return NextResponse.json(cards);
    }
  }

  // Fallback: return random flashcards (no auth needed)
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
