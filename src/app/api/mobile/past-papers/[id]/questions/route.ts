import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

// GET /api/mobile/past-papers/[id]/questions
export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const pastPaper = await prisma.pastPaper.findUnique({
      where: { id: params.id },
      select: {
        id: true, title: true, timeLimitMin: true, isInteractive: true,
        kind: true, randomizeQuestions: true, allowAiDuringQuiz: true,
        aiExplanationEnabled: true, secureExamMode: true, trackFocusLoss: true,
        isPrivate: true, semesterId: true, moduleId: true, quizLectureId: true,
        module: { select: { id: true, name: true } },
      },
    });

    if (!pastPaper) {
      return NextResponse.json({ error: 'PastPaper not found' }, { status: 404 });
    }

    // Get all questions from the lectures in this module
    let questions = await prisma.question.findMany({
      where: {
        lecture: {
          subject: { moduleId: pastPaper.moduleId }
        }
      },
      select: {
        id: true, body: true, choices: true, answer: true,
        explanation: true, aiExplanation: true, difficulty: true,
        imageUrl: true, questionType: true, stemLayout: true,
        lectureId: true,
        lecture: { select: { id: true, title: true, subject: { select: { id: true, name: true } } } }
      },
    });

    // If quizLectureId is set, filter to only that lecture
    if (pastPaper.quizLectureId) {
      questions = questions.filter(q => q.lectureId === pastPaper.quizLectureId);
    }

    // Shuffle if randomize flag is set
    if (pastPaper.randomizeQuestions) {
      questions = questions.sort(() => Math.random() - 0.5);
    }

    return NextResponse.json({ pastPaper, questions });
  } catch (error) {
    console.error('[MOBILE_PAST_PAPER_QUESTIONS_GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
