import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { parseQuality, calculateSM2 } from '@/lib/flashcard-engine';

export const dynamic = 'force-dynamic';

// POST /api/mobile/flashcards/[id]/review
export const POST = withAuth(async ({ req, userId, params: rawParams }) => {
  try {
    const params = await rawParams;
    const flashcardId = params.id;
    const body = await req.json().catch(() => ({}));
    const rating = body.rating as string;

    if (!rating || !['again', 'hard', 'good', 'easy'].includes(rating)) {
      return NextResponse.json({ error: 'Invalid rating. Use: again, hard, good, easy' }, { status: 400 });
    }

    const flashcard = await prisma.flashcard.findUnique({ where: { id: flashcardId } });
    if (!flashcard) return NextResponse.json({ error: 'Flashcard not found' }, { status: 404 });

    const quality = parseQuality(rating);

    const existing = await prisma.userFlashcardProgress.findUnique({
      where: { userId_flashcardId: { userId, flashcardId } },
    });

    const prev = existing ?? { repetitions: 0, easeFactor: 2.5, interval: 0 };
    const result = calculateSM2(
      { repetitions: prev.repetitions, easeFactor: prev.easeFactor, interval: prev.interval },
      quality,
    );

    const progress = await prisma.userFlashcardProgress.upsert({
      where: { userId_flashcardId: { userId, flashcardId } },
      create: {
        userId,
        flashcardId,
        interval: result.interval,
        repetitions: result.repetitions,
        easeFactor: result.easeFactor,
        nextReviewAt: result.nextReviewAt,
        lastReviewedAt: new Date(),
        lastRating: quality,
      },
      update: {
        interval: result.interval,
        repetitions: result.repetitions,
        easeFactor: result.easeFactor,
        nextReviewAt: result.nextReviewAt,
        lastReviewedAt: new Date(),
        lastRating: quality,
      },
      include: {
        flashcard: { select: { id: true, front: true, back: true, lecture: { select: { title: true } } } },
      },
    });

    return NextResponse.json(progress);
  } catch (error) {
    console.error('[MOBILE_FLASHCARD_REVIEW]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});
