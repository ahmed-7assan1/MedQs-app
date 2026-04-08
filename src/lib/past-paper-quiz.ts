import { prisma } from "@/lib/prisma";

const questionQuizSelect = {
  id: true,
  body: true,
  imageUrl: true,
  stemLayout: true,
  choices: true,
  answer: true,
  explanation: true,
  difficulty: true,
  lectureId: true,
} as const;

export type QuizQuestionPayload = {
  id: string;
  body: string;
  imageUrl: string | null;
  stemLayout: "STANDARD" | "IMAGE_OVERLAY";
  choices: unknown;
  answer: string;
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
): Promise<{ id: string; answer: string }[]> {
  const paper = await prisma.pastPaper.findUnique({
    where: { id: paperId },
    select: { moduleId: true, quizLectureId: true },
  });
  if (!paper) return [];

  if (paper.quizLectureId) {
    return prisma.question.findMany({
      where: { lectureId: paper.quizLectureId },
      select: { id: true, answer: true },
      orderBy: [{ createdAt: "asc" }],
    });
  }

  return prisma.question.findMany({
    where: { lecture: { subject: { moduleId: paper.moduleId } } },
    select: { id: true, answer: true },
  });
}
