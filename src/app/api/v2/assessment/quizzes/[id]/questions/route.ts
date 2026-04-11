import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireAdminWriter, assertPastPaper, assertLecture } from "@/lib/admin-scope";
import { ok, fail } from "@/platform/api/envelope";
import { FLAG_V2_ORG_CONTENT_ASSESSMENT, requireFeatureEnabled } from "@/platform/flags";
import { devBypassFromRequest } from "@/platform/dev-auth";
import { getSessionScope } from "@/lib/tenant";

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> | { id: string } }
) {
  const dev = devBypassFromRequest(req);
  const session = dev ? null : await auth();
  const w = await requireAdminWriter(session);
  if (!w.ok && !dev) return w.response;

  const scope = dev
    ? { userId: dev.actorUserId, role: dev.role, universityId: dev.universityId, semesterId: null }
    : await getSessionScope(session);
  if (!scope) return fail({ error: "Unauthorized", status: 401 });

  const enabled = await requireFeatureEnabled({
    key: FLAG_V2_ORG_CONTENT_ASSESSMENT,
    universityId: scope.universityId,
  });
  if (!enabled) return fail({ error: "V2 disabled", status: 404 });

  const { id } = await Promise.resolve(ctx.params);
  const boundary = await assertPastPaper(scope as any, id);
  if (boundary) return boundary;

  const paper = await prisma.pastPaper.findUnique({
    where: { id },
    select: { id: true, quizLectureId: true, kind: true },
  });
  if (!paper) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (paper.kind !== "ADMIN_AUTHORED_QUIZ" || !paper.quizLectureId) {
    return NextResponse.json({ error: "Quiz has no lecture question bank" }, { status: 400 });
  }

  const lectureBoundary = await assertLecture(scope as any, paper.quizLectureId);
  if (lectureBoundary) return lectureBoundary;

  const body = await req.json().catch(() => ({}));
  const questionType = body?.questionType === "ESSAY" ? "ESSAY" : "MCQ";
  const questionBody = typeof body.body === "string" ? body.body : "";
  const choices = Array.isArray(body.choices) ? body.choices : null;
  const answer = typeof body.answer === "string" ? body.answer : "";
  const essayReference = typeof body.essayReference === "string" ? body.essayReference : "";
  const difficulty = typeof body.difficulty === "string" ? body.difficulty : "MEDIUM";

  if (questionType === "MCQ") {
    if (!choices || choices.length < 2) return fail({ error: "choices must have at least 2 items", status: 400 });
    if (!answer) return fail({ error: "answer required", status: 400 });
  }

  const question = await prisma.question.create({
    data: {
      questionType,
      lectureId: paper.quizLectureId,
      body: questionBody,
      stemLayout: "STANDARD",
      choices: questionType === "ESSAY" ? [] : choices,
      answer: questionType === "ESSAY" ? "ESSAY" : answer,
      essayReference: questionType === "ESSAY" ? essayReference || answer : null,
      difficulty: difficulty === "EASY" || difficulty === "HARD" ? difficulty : "MEDIUM",
      explanation: typeof body.explanation === "string" ? body.explanation : null,
      imageUrl: typeof body.imageUrl === "string" ? body.imageUrl : null,
    },
    select: { id: true, lectureId: true },
  });

  return ok({
    tenantKey: scope.universityId,
    actor: { id: scope.userId, role: scope.role ?? "STUDENT" },
    result: { questionId: question.id, lectureId: question.lectureId },
    status: 201,
  });
}
