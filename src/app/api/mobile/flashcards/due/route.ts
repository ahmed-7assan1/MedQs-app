import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getToken } from 'next-auth/jwt';
import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

// GET /api/mobile/flashcards/due
export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.sub) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userId = token.sub as string;

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
}
