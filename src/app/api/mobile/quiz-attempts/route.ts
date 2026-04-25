import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getToken } from 'next-auth/jwt';
import { NextRequest } from 'next/server';

// POST /api/mobile/quiz-attempts — Submit quiz, get score + items back
export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const body = await req.json();
    const { pastPaperId, answers, timeTaken, focusLossCount, guestQuizUserId } = body;

    if (!pastPaperId || !answers) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const userId = token?.sub || (token?.id as string) || null;

    // Fetch correct answers for all questions in the answers list
    const questionIds = answers.map((a: any) => a.questionId);
    const questions = await prisma.question.findMany({
      where: { id: { in: questionIds } },
      select: { id: true, answer: true, explanation: true, aiExplanation: true, body: true, choices: true, questionType: true },
    });

    const questionMap = new Map(questions.map((q) => [q.id, q]));

    // Score calculation
    const items = answers.map((a: any) => {
      const q = questionMap.get(a.questionId);
      const isCorrect = q ? q.answer === a.chosen : false;
      return { questionId: a.questionId, chosen: a.chosen ?? null, isCorrect };
    });

    const correct = items.filter((i: any) => i.isCorrect).length;
    const score = Math.round((correct / items.length) * 100);

    // Persist attempt
    const attempt = await prisma.quizAttempt.create({
      data: {
        pastPaperId,
        score,
        timeTaken: timeTaken ?? 0,
        focusLossCount: focusLossCount ?? 0,
        ...(userId ? { userId } : {}),
        ...(guestQuizUserId ? { guestQuizUserId } : {}),
        items: {
          create: items.map((i: any) => ({
            questionId: i.questionId,
            chosen: i.chosen,
            isCorrect: i.isCorrect,
          })),
        },
      },
      include: { items: { include: { question: { select: { id: true, body: true, answer: true, explanation: true, aiExplanation: true, choices: true } } } } },
    });

    // Award points if user logged in
    if (userId) {
      await prisma.user.update({ where: { id: userId }, data: { points: { increment: Math.floor(score / 10) } } });
      await prisma.engagementLog.create({ data: { userId, action: 'QUIZ_COMPLETE', points: Math.floor(score / 10) } });
    }

    return NextResponse.json({ attemptId: attempt.id, score, totalQuestions: items.length, correct, items: attempt.items });
  } catch (error) {
    console.error('[MOBILE_QUIZ_ATTEMPTS_POST]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/mobile/quiz-attempts?userId=...&limit=20
export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const userId = (token?.sub || token?.id) as string;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '20');

    const attempts = await prisma.quizAttempt.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        pastPaper: { select: { id: true, title: true, kind: true, module: { select: { name: true } } } },
        _count: { select: { items: true } },
      },
    });

    return NextResponse.json(attempts);
  } catch (error) {
    console.error('[MOBILE_QUIZ_ATTEMPTS_GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
