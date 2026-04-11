import type { Prisma } from "@/generated/prisma";

export type EssayGradeStored = {
  feedback: string;
  scorePercent: number;
  stagesMet: number;
  stagesTotal: number;
  stageNotes: string[];
};

export function parseEssayGrade(raw: unknown): EssayGradeStored | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const o = raw as Record<string, unknown>;
  const scorePercent = Number(o.scorePercent);
  if (!Number.isFinite(scorePercent)) return null;
  const stagesMet = Math.max(0, Math.floor(Number(o.stagesMet) || 0));
  const stagesTotal = Math.max(1, Math.floor(Number(o.stagesTotal) || 4));
  const stageNotes = Array.isArray(o.stageNotes)
    ? o.stageNotes.filter((x): x is string => typeof x === "string").slice(0, 12)
    : [];
  return {
    feedback: String(o.feedback ?? "").slice(0, 2000),
    scorePercent: Math.max(0, Math.min(100, Math.round(scorePercent))),
    stagesMet,
    stagesTotal,
    stageNotes,
  };
}

export function essayGradeToJson(grade: EssayGradeStored): Prisma.InputJsonValue {
  return {
    feedback: grade.feedback,
    scorePercent: grade.scorePercent,
    stagesMet: grade.stagesMet,
    stagesTotal: grade.stagesTotal,
    stageNotes: grade.stageNotes,
  };
}
