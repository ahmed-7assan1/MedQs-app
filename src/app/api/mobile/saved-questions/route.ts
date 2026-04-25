import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getToken } from 'next-auth/jwt';
import { NextRequest } from 'next/server';

// GET /api/mobile/saved-questions
export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const userId = (token?.sub || token?.id) as string | undefined;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const saved = await prisma.savedQuestion.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        question: {
          select: {
            id: true, body: true, choices: true, answer: true,
            explanation: true, difficulty: true, imageUrl: true, questionType: true,
            lecture: { select: { id: true, title: true, subject: { select: { name: true } } } },
          },
        },
      },
    });

    return NextResponse.json(saved);
  } catch (error) {
    console.error('[MOBILE_SAVED_QUESTIONS_GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/mobile/saved-questions — save or unsave
export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const userId = (token?.sub || token?.id) as string | undefined;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { questionId } = await req.json();
    if (!questionId) return NextResponse.json({ error: 'questionId required' }, { status: 400 });

    const existing = await prisma.savedQuestion.findUnique({ where: { userId_questionId: { userId, questionId } } });

    if (existing) {
      await prisma.savedQuestion.delete({ where: { userId_questionId: { userId, questionId } } });
      return NextResponse.json({ saved: false });
    } else {
      await prisma.savedQuestion.create({ data: { userId, questionId } });
      return NextResponse.json({ saved: true }, { status: 201 });
    }
  } catch (error) {
    console.error('[MOBILE_SAVED_QUESTIONS_POST]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
