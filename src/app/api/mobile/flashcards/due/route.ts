import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';

export const dynamic = 'force-dynamic';

// GET /api/mobile/flashcards/due
export const GET = withAuth(async ({ userId }) => {
  try {
    const dueCards = await prisma.userFlashcardProgress.findMany({
      where: { userId, nextReviewAt: { lte: new Date() } },
      include: {
        flashcard: {
          select: {
            id: true, front: true, back: true, lectureId: true,
            lecture: { select: { id: true, title: true } },
          },
        },
      },
      orderBy: { nextReviewAt: 'asc' },
      take: 100,
    });

    return NextResponse.json(dueCards);
  } catch (error) {
    console.error('[MOBILE_FLASHCARDS_DUE_GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});
