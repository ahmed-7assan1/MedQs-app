import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSessionScope, isAdminRole } from "@/lib/tenant";
import { fail, ok } from "@/platform/api/envelope";
import { NextRequest } from "next/server";

/**
 * POST /api/v1/admin/quiz-transfer
 * Body: { paperId: string, targetSemesterId: string, targetModuleId: string, mode: "move" | "copy" }
 * 
 * move: Updates the PastPaper's semesterId + moduleId in place
 * copy: Creates a deep copy of the PastPaper + its quiz lecture + all questions
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  const scope = await getSessionScope(session);
  if (!scope || !isAdminRole(scope.role)) {
    return fail({ error: "Unauthorized", status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { paperId, targetSemesterId, targetModuleId, mode } = body as {
    paperId?: string;
    targetSemesterId?: string;
    targetModuleId?: string;
    mode?: "move" | "copy";
  };

  if (!paperId || !targetSemesterId || !targetModuleId) {
    return fail({ error: "paperId, targetSemesterId, and targetModuleId are required", status: 400 });
  }
  if (mode !== "move" && mode !== "copy") {
    return fail({ error: 'mode must be "move" or "copy"', status: 400 });
  }

  // Fetch the source paper with its lecture and questions
  const paper = await prisma.pastPaper.findUnique({
    where: { id: paperId },
    include: {
      quizLecture: {
        include: { questions: true },
      },
    },
  });

  if (!paper) return fail({ error: "Quiz not found", status: 404 });

  // Verify target semester + module exist
  const [targetSemester, targetModule] = await Promise.all([
    prisma.semester.findUnique({ where: { id: targetSemesterId } }),
    prisma.module.findUnique({ where: { id: targetModuleId } }),
  ]);
  if (!targetSemester) return fail({ error: "Target semester not found", status: 404 });
  if (!targetModule) return fail({ error: "Target module not found", status: 404 });

  if (mode === "move") {
    const updated = await prisma.pastPaper.update({
      where: { id: paperId },
      data: {
        semesterId: targetSemesterId,
        moduleId: targetModuleId,
      },
    });
    return ok({ result: updated, message: "Quiz moved successfully" });
  }

  // mode === "copy" — deep copy
  // 1. Find or create a quiz-bank subject + lecture in the target module
  let targetSubject = await prisma.subject.findFirst({
    where: { moduleId: targetModuleId, isQuizSystemBank: true },
  });
  if (!targetSubject) {
    targetSubject = await prisma.subject.create({
      data: {
        name: `Quiz Bank — ${targetModule.name}`,
        moduleId: targetModuleId,
        semesterId: targetSemesterId,
        isQuizSystemBank: true,
      },
    });
  }

  let targetLecture = await prisma.lecture.findFirst({
    where: { subjectId: targetSubject.id },
  });
  if (!targetLecture) {
    targetLecture = await prisma.lecture.create({
      data: {
        title: "Quiz System Bank",
        subjectId: targetSubject.id,
        order: 0,
      },
    });
  }

  // 2. Create the copied PastPaper
  const copiedPaper = await prisma.pastPaper.create({
    data: {
      title: `${paper.title} (Copy)`,
      semesterId: targetSemesterId,
      moduleId: targetModuleId,
      isInteractive: paper.isInteractive,
      timeLimitMin: paper.timeLimitMin,
      aiExplanationEnabled: paper.aiExplanationEnabled,
      allowAiDuringQuiz: paper.allowAiDuringQuiz,
      restrictCopyPaste: paper.restrictCopyPaste,
      secureExamMode: paper.secureExamMode,
      trackFocusLoss: paper.trackFocusLoss,
      kind: paper.kind,
      isPrivate: paper.isPrivate,
      randomizeQuestions: paper.randomizeQuestions,
      quizLectureId: targetLecture.id,
    },
  });

  // 3. Copy all questions to the target lecture
  const sourceQuestions = paper.quizLecture?.questions ?? [];
  if (sourceQuestions.length > 0) {
    await prisma.question.createMany({
      data: sourceQuestions.map((q) => ({
        body: q.body,
        choices: q.choices,
        answer: q.answer,
        explanation: q.explanation,
        aiExplanation: q.aiExplanation,
        difficulty: q.difficulty,
        imageUrl: q.imageUrl,
        stemLayout: q.stemLayout,
        essayReference: q.essayReference,
        questionType: q.questionType,
        lectureId: targetLecture!.id,
      })),
    });
  }

  return ok({
    result: copiedPaper,
    message: `Quiz copied successfully with ${sourceQuestions.length} questions`,
  });
}

/**
 * POST /api/v1/admin/quiz-transfer/migrate
 * Migrates all existing quizzes to a target semester/module
 * Body: { targetSemesterId: string, targetModuleId: string }
 */
export async function PUT(req: NextRequest) {
  const session = await auth();
  const scope = await getSessionScope(session);
  if (!scope || scope.role !== "SUPER_ADMIN") {
    return fail({ error: "SUPER_ADMIN only", status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const { targetSemesterId, targetModuleId } = body as {
    targetSemesterId?: string;
    targetModuleId?: string;
  };

  if (!targetSemesterId || !targetModuleId) {
    return fail({ error: "targetSemesterId and targetModuleId are required", status: 400 });
  }

  // Update all PastPapers that don't belong to the target semester
  const result = await prisma.pastPaper.updateMany({
    where: {
      semesterId: { not: targetSemesterId },
    },
    data: {
      semesterId: targetSemesterId,
      moduleId: targetModuleId,
    },
  });

  return ok({
    result: { migratedCount: result.count },
    message: `Migrated ${result.count} quizzes to target semester`,
  });
}
