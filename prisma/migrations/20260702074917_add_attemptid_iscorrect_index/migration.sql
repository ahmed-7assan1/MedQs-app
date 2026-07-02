-- Add composite index for wrong-answer lookups in study context
CREATE INDEX IF NOT EXISTS "QuizAttemptItem_attemptId_isCorrect_idx" ON "QuizAttemptItem"("attemptId", "isCorrect");
