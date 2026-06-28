import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';

// GET /api/mobile/quiz-attempts/[id]
export const GET = withAuth(async ({ userId, token, params: rawParams }) => {
  try {
    const params = await rawParams;
    const attempt = await prisma.quizAttempt.findUnique({
      where: { id: params.id },
      include: {
        pastPaper: { select: { id: true, title: true, timeLimitMin: true, kind: true } },
        items: {
          include: {
            question: {
              select: {
                id: true, body: true, choices: true, answer: true,
                explanation: true, aiExplanation: true, difficulty: true,
                imageUrl: true, questionType: true,
              },
            },
          },
        },
      },
    });

    if (!attempt) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const isOwner = attempt.userId === userId;
    const role = token?.role as string | undefined;
    const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN';
    if (!isOwner && !isAdmin)
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    return NextResponse.json(attempt);
  } catch (error) {
    console.error('[MOBILE_QUIZ_ATTEMPT_GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});
