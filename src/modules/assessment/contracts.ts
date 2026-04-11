export type QuestionType = "MCQ" | "MULTI_SELECT" | "TRUE_FALSE" | "CASE_BASED";

export type QuizEvaluation = {
  attemptId: string;
  scorePercent: number;
  correctCount: number;
  wrongCount: number;
  submittedAt: string;
};

export type AssessmentServiceContract = {
  publishQuiz: (quizId: string, actorUserId: string) => Promise<{ ok: true }>;
  evaluateAttempt: (attemptId: string) => Promise<QuizEvaluation>;
};
