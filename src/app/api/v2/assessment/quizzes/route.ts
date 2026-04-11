import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireAdminWriter, assertLecture } from "@/lib/admin-scope";
import { ok, fail } from "@/platform/api/envelope";
import { FLAG_V2_ORG_CONTENT_ASSESSMENT, requireFeatureEnabled } from "@/platform/flags";
import { devBypassFromRequest } from "@/platform/dev-auth";
import { getSessionScope } from "@/lib/tenant";

// Creates an admin-authored quiz (PastPaper) and attaches it to an existing lecture via quizLectureId.
export async function POST(req: NextRequest) {
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

  const body = await req.json().catch(() => ({}));
  const lectureId = typeof body.lectureId === "string" ? body.lectureId : "";
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const timeLimitMin =
    body.timeLimitMin != null && body.timeLimitMin !== ""
      ? Math.max(1, parseInt(String(body.timeLimitMin), 10))
      : null;
  if (!lectureId || !title) return fail({ error: "lectureId and title required", status: 400 });

  const boundary = await assertLecture(scope as any, lectureId);
  if (boundary) return boundary;

  const lecture = await prisma.lecture.findUnique({
    where: { id: lectureId },
    select: {
      id: true,
      subject: { select: { moduleId: true, module: { select: { semesterId: true } } } },
    },
  });
  if (!lecture) return fail({ error: "Lecture not found", status: 404 });

  // Ensure this lecture isn't already attached to an existing quiz.
  const existing = await prisma.pastPaper.findFirst({
    where: { quizLectureId: lectureId },
    select: { id: true },
  });
  if (existing) return fail({ error: "Lecture already has a quiz attached", status: 409 });

  const paper = await prisma.pastPaper.create({
    data: {
      title,
      kind: "ADMIN_AUTHORED_QUIZ",
      isInteractive: true,
      semesterId: lecture.subject.module.semesterId,
      moduleId: lecture.subject.moduleId,
      quizLectureId: lectureId,
      timeLimitMin,
    },
    select: { id: true, title: true, kind: true, quizLectureId: true, moduleId: true, semesterId: true },
  });

  return ok({
    tenantKey: scope.universityId,
    actor: { id: scope.userId, role: scope.role ?? "STUDENT" },
    result: paper,
    status: 201,
  });
}
