import { Prisma } from "@prisma/client";
import { gradeEssayAnswerWithMeta, type AIRequestOptions } from "@/lib/gemini";
import { essayGradeToJson, type EssayGradeStored } from "@/lib/essay-grade";

export type QuizAnswerKeyRow = {
  id: string;
  body: string;
  questionType: "MCQ" | "ESSAY";
  answer: string;
  essayReference: string | null;
};

export type QuizAttemptItemCreate = {
  questionId: string;
  chosen: string;
  isCorrect: boolean;
  essayGrade?: Prisma.InputJsonValue;
};

export async function buildQuizAttemptItems(
  keys: QuizAnswerKeyRow[],
  answers: Record<string, unknown> | null | undefined,
  options?: AIRequestOptions
): Promise<QuizAttemptItemCreate[]> {
  const items: QuizAttemptItemCreate[] = [];

  for (const q of keys) {
    const rawAnswer = answers?.[q.id];
    const chosen = typeof rawAnswer === "string" ? rawAnswer : "";
    if (q.questionType === "ESSAY") {
      const reference = String(q.essayReference || q.answer || "").trim();
      if (!chosen.trim() || !reference) {
        items.push({ questionId: q.id, chosen, isCorrect: false });
        continue;
      }
      try {
        const stem = (q.body || "").trim().slice(0, 6000) || "Essay question";
        const graded = await gradeEssayAnswerWithMeta(
          {
            question: stem,
            studentAnswer: chosen,
            referenceAnswer: reference,
          },
          options
        );
        const d = graded.data;
        const stored: EssayGradeStored = {
          feedback: d.feedback,
          scorePercent: d.scorePercent,
          stagesMet: d.stagesMet,
          stagesTotal: d.stagesTotal,
          stageNotes: d.stageNotes,
        };
        const isCorrect = d.scorePercent >= 65 || d.isCorrect || d.confidence >= 0.72;
        items.push({
          questionId: q.id,
          chosen,
          isCorrect,
          essayGrade: essayGradeToJson(stored),
        });
      } catch {
        items.push({ questionId: q.id, chosen, isCorrect: false });
      }
      continue;
    }
    items.push({
      questionId: q.id,
      chosen,
      isCorrect: chosen === q.answer,
    });
  }

  return items;
}
