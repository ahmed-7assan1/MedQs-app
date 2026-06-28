import { z } from "zod";

export const questionType = z.enum(["MCQ", "MULTI_SELECT", "TRUE_FALSE", "CASE_BASED", "ESSAY"]);

export const difficultyLevel = z.enum(["EASY", "MEDIUM", "HARD"]);

export const stemLayout = z.enum(["STANDARD", "IMAGE_OVERLAY"]);

export const choiceItem = z.object({
  key: z.string(),
  text: z.string(),
});

export const isValidQuestionImageUrl = (s: string): boolean => {
  if (s.startsWith("/")) return true;
  if (s.startsWith("data:image/")) return true;
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
};

export const createQuestionSchema = z
  .object({
    questionType: questionType.optional(),
    body: z.string().default(""),
    imageUrl: z
      .preprocess(
        (v) => (v === "" || v === undefined ? null : v),
        z.union([
          z.null(),
          z.string().refine(isValidQuestionImageUrl, { message: "Invalid image URL" }),
        ])
      )
      .optional(),
    stemLayout: stemLayout.optional(),
    choices: z.array(choiceItem).optional(),
    answer: z.string().default(""),
    essayReference: z.string().optional(),
    explanation: z.string().optional(),
    difficulty: difficultyLevel.default("MEDIUM"),
    lectureId: z.string().uuid(),
  })
  .transform((d) => ({
    ...d,
    questionType: d.questionType ?? "MCQ",
    choices: d.questionType === "ESSAY" ? [] : d.choices ?? [],
    body: d.body.trim(),
    imageUrl: d.imageUrl === "" || d.imageUrl == null ? null : d.imageUrl,
    stemLayout: d.stemLayout ?? "STANDARD",
    essayReference: d.essayReference?.trim() || null,
  }))
  .refine((d) => d.body.length >= 1 || Boolean(d.imageUrl), {
    message: "Add question text and/or an image",
    path: ["body"],
  })
  .refine((d) => d.stemLayout !== "IMAGE_OVERLAY" || Boolean(d.imageUrl), {
    message: "Overlay layout requires an image URL",
    path: ["stemLayout"],
  })
  .refine((d) => (d.questionType === "ESSAY" ? true : (d.choices?.length ?? 0) >= 2), {
    message: "MCQ must include at least 2 choices",
    path: ["choices"],
  })
  .refine((d) => (d.questionType === "ESSAY" ? true : Boolean(d.answer)), {
    message: "MCQ must include a correct answer key",
    path: ["answer"],
  });

export const v2QuizSchema = z.object({
  title: z.string().min(1).max(200).trim(),
  moduleId: z.string().uuid(),
  lectureId: z.string().uuid().optional(),
  timeLimitSec: z.number().int().positive().optional(),
  questions: z.array(z.object({
    questionId: z.string().uuid(),
    orderNo: z.number().int().min(0),
    points: z.number().int().min(0).default(1),
  })).min(1, "Quiz must have at least one question"),
});

export const quizAttemptSchema = z.object({
  quizId: z.string().uuid(),
  answers: z.array(z.object({
    questionId: z.string().uuid(),
    answerJson: z.any(),
  })).min(1),
});

export type CreateQuestionInput = z.infer<typeof createQuestionSchema>;
export type V2QuizInput = z.infer<typeof v2QuizSchema>;
export type QuizAttemptInput = z.infer<typeof quizAttemptSchema>;
