import { prisma } from "@/lib/prisma";

const questionQuizSelect = {
  id: true,
  questionType: true,
  body: true,
  imageUrl: true,
  stemLayout: true,
  choices: true,
  answer: true,
  essayReference: true,
  explanation: true,
  difficulty: true,
  lectureId: true,
} as const;

export type QuizQuestionPayload = {
  id: string;
  questionType: "MCQ" | "ESSAY";
  body: string;
  imageUrl: string | null;
  stemLayout: "STANDARD" | "IMAGE_OVERLAY";
  choices: unknown;
  answer: string;
  essayReference: string | null;
  explanation: string | null;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  lectureId: string;
};

/** Questions for a paper: if it has a dedicated quiz lecture, use its questions; otherwise use all module questions (legacy). */
export async function loadQuestionsForPastPaper(paperId: string): Promise<QuizQuestionPayload[]> {
  const paper = await prisma.pastPaper.findUnique({
    where: { id: paperId },
    select: { moduleId: true, quizLectureId: true },
  });
  if (!paper) return [];

  if (paper.quizLectureId) {
    const rows = await prisma.question.findMany({
      where: { lectureId: paper.quizLectureId },
      select: questionQuizSelect,
      orderBy: [{ createdAt: "asc" }],
    });
    return rows as QuizQuestionPayload[];
  }

  const legacy = await prisma.question.findMany({
    where: { lecture: { subject: { moduleId: paper.moduleId } } },
    select: questionQuizSelect,
  });
  return legacy as QuizQuestionPayload[];
}

export async function loadQuestionAnswerKeysForPastPaper(
  paperId: string
): Promise<
  { id: string; body: string; answer: string; questionType: "MCQ" | "ESSAY"; essayReference: string | null }[]
> {
  const paper = await prisma.pastPaper.findUnique({
    where: { id: paperId },
    select: { moduleId: true, quizLectureId: true },
  });
  if (!paper) return [];

  if (paper.quizLectureId) {
    return prisma.question.findMany({
      where: { lectureId: paper.quizLectureId },
      select: { id: true, body: true, answer: true, questionType: true, essayReference: true },
      orderBy: [{ createdAt: "asc" }],
    }) as any;
  }

  return prisma.question.findMany({
    where: { lecture: { subject: { moduleId: paper.moduleId } } },
    select: { id: true, body: true, answer: true, questionType: true, essayReference: true },
  }) as any;
}
