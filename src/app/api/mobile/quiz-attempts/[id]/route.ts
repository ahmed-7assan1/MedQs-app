import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getToken } from 'next-auth/jwt';
import { NextRequest } from 'next/server';

// GET /api/mobile/quiz-attempts/[id]
export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.sub) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const params = await props.params;
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

    const userId = token.sub as string;
    const isOwner = attempt.userId === userId;
    const role = (token as any).role;
    const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN';
    if (!isOwner && !isAdmin)
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    return NextResponse.json(attempt);
  } catch (error) {
    console.error('[MOBILE_QUIZ_ATTEMPT_GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
