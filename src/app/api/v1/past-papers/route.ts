import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assertPastPaperCreatePayload, requireAdminWriter } from "@/lib/admin-scope";
import { getSessionScope, isSuperAdmin } from "@/lib/tenant";
import { wantsV2OrgContentAssessment } from "@/platform/v2-toggle";

export async function GET(req: NextRequest) {
  const session = await auth();
  const scope = await getSessionScope(session);
  if (!scope) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isSuperAdmin(scope.role) && !scope.universityId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const semesterId = searchParams.get("semesterId");
  const where = semesterId ? { semesterId } : {};

  let papers: any[] = [];
  try {
    papers = await prisma.pastPaper.findMany({
      where: isSuperAdmin(scope.role)
        ? where
        : {
            ...where,
            semester: { academicYear: { universityId: scope.universityId! } },
          },
      orderBy: { createdAt: "desc" },
      include: {
        module: { select: { name: true } },
        _count: { select: { attempts: true } },
      },
    });
  } catch {
    // Backward-compat when DB is not migrated yet.
    const legacy = await prisma.pastPaper.findMany({
      where: isSuperAdmin(scope.role)
        ? where
        : {
            ...where,
            semester: { academicYear: { universityId: scope.universityId! } },
          },
      orderBy: { createdAt: "desc" },
      include: {
        module: { select: { name: true } },
        _count: { select: { attempts: true } },
      },
    });
    papers = legacy.map((p) => ({
      ...p,
      googleSheetsSyncEnabled: false,
      _count: { ...p._count },
    }));
  }

  return NextResponse.json(papers);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const w = await requireAdminWriter(session);
  if (!w.ok) return w.response;

  const body = await req.json();
  const semesterId = String(body.semesterId ?? "");
  const moduleId = String(body.moduleId ?? "");
  const payloadErr = await assertPastPaperCreatePayload(w.scope, semesterId, moduleId);
  if (payloadErr) return payloadErr;

  const kindRaw = typeof body.kind === "string" ? body.kind.trim() : "";
  const isAdminQuiz = kindRaw === "ADMIN_AUTHORED_QUIZ";
  const useV2 = await wantsV2OrgContentAssessment(req, w.scope.universityId);

  const paper = await prisma.$transaction(async (tx) => {
    // V2 toggle: allow attaching admin-authored quiz to a specific existing lecture.
    const v2LectureId =
      useV2 && typeof body.lectureId === "string" && body.lectureId.trim() ? body.lectureId.trim() : null;

    if (v2LectureId) {
      const lecture = await tx.lecture.findUnique({
        where: { id: v2LectureId },
        select: { id: true, subject: { select: { moduleId: true, module: { select: { semesterId: true } } } } },
      });
      if (!lecture) throw new Error("Lecture not found");
      // Attach quiz to that lecture question bank.
      return tx.pastPaper.create({
        data: {
          title: String(body.title ?? "").trim(),
          semesterId: lecture.subject.module.semesterId,
          moduleId: lecture.subject.moduleId,
          isInteractive: true,
          kind: "ADMIN_AUTHORED_QUIZ",
          quizLectureId: lecture.id,
          timeLimitMin:
            body.timeLimitMin != null && body.timeLimitMin !== ""
              ? Math.max(1, parseInt(String(body.timeLimitMin), 10))
              : null,
        },
        select: { id: true, title: true, moduleId: true, semesterId: true, quizLectureId: true, kind: true },
      });
    }

    const created = await tx.pastPaper.create({
      data: {
        title: String(body.title ?? "").trim(),
        semesterId,
        moduleId,
        // Admin-authored quizzes are interactive by default.
        isInteractive: isAdminQuiz ? true : Boolean(body.isInteractive),
        kind: isAdminQuiz ? "ADMIN_AUTHORED_QUIZ" : "MODULE_QUESTION_BANK",
        timeLimitMin:
          body.timeLimitMin != null && body.timeLimitMin !== ""
            ? Math.max(1, parseInt(String(body.timeLimitMin), 10))
            : null,
        pdfUrl: body.pdfUrl ? String(body.pdfUrl) : null,
        aiExplanationEnabled: body.aiExplanationEnabled !== false,
        allowAiDuringQuiz: Boolean(body.allowAiDuringQuiz),
        secureExamMode: Boolean(body.secureExamMode),
        restrictCopyPaste: Boolean(body.restrictCopyPaste),
        trackFocusLoss: Boolean(body.trackFocusLoss),
        googleSheetsSyncEnabled: Boolean(body.googleSheetsSyncEnabled),
      },
      select: { id: true, title: true, moduleId: true, semesterId: true, quizLectureId: true, kind: true },
    });

    if (!isAdminQuiz) return created;

    // Ensure a “Quizzes” subject in this module to host quiz-specific lectures.
    const subj =
      (await tx.subject.findFirst({
        where: { moduleId, isQuizSystemBank: true },
        select: { id: true },
      })) ??
      (await tx.subject.create({
        data: { moduleId, name: "Quizzes", isQuizSystemBank: true },
        select: { id: true },
      }));

    const lecture = await tx.lecture.create({
      data: {
        subjectId: subj.id,
        title: `— Quiz: ${created.title} —`,
        order: 10_000, // keep quiz lectures after curriculum by default
      },
      select: { id: true },
    });

    return tx.pastPaper.update({
      where: { id: created.id },
      data: { quizLectureId: lecture.id },
      select: { id: true, title: true, moduleId: true, semesterId: true, quizLectureId: true, kind: true },
    });
  });

  return NextResponse.json(paper, { status: 201 });
}
