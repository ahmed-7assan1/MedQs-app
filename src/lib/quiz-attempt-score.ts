export type QuizKeyForScore = { id: string; questionType: "MCQ" | "ESSAY" };

export type QuizItemForScore = {
  questionId: string;
  isCorrect: boolean;
  essayGrade?: unknown;
};

/** Per-question weight 1; MCQ 0/100; ESSAY uses AI scorePercent when present. */
export function computeWeightedQuizPercent(keys: QuizKeyForScore[], items: QuizItemForScore[]): number {
  if (keys.length === 0) return 0;
  const byId = new Map(items.map((i) => [i.questionId, i]));
  let sum = 0;
  for (const k of keys) {
    const it = byId.get(k.id);
    if (!it) continue;
    if (k.questionType === "ESSAY") {
      const g = it.essayGrade as { scorePercent?: number } | null | undefined;
      if (typeof g?.scorePercent === "number" && Number.isFinite(g.scorePercent)) {
        sum += Math.max(0, Math.min(100, Math.round(g.scorePercent)));
      } else {
        sum += it.isCorrect ? 100 : 0;
      }
    } else {
      sum += it.isCorrect ? 100 : 0;
    }
  }
  return Math.round(sum / keys.length);
}
