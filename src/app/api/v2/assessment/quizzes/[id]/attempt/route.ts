import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSessionScope, isSuperAdmin } from "@/lib/tenant";
import { loadQuestionAnswerKeysForPastPaper } from "@/lib/past-paper-quiz";
import { ok, fail } from "@/platform/api/envelope";
import { FLAG_V2_ORG_CONTENT_ASSESSMENT, requireFeatureEnabled } from "@/platform/flags";
import { devBypassFromRequest } from "@/platform/dev-auth";
import { buildQuizAttemptItems } from "@/lib/quiz-attempt-items";
import { computeWeightedQuizPercent } from "@/lib/quiz-attempt-score";

// POST /api/v2/assessment/quizzes/:id/attempt
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> | { id: string } }) {
  const dev = devBypassFromRequest(req);
  const session = dev ? null : await auth();
  const scope = dev
    ? { userId: dev.actorUserId, role: dev.role, universityId: dev.universityId, semesterId: null }
    : await getSessionScope(session);
  if (!scope?.userId) return fail({ error: "Unauthorized", status: 401 });

  const enabled = await requireFeatureEnabled({
    key: FLAG_V2_ORG_CONTENT_ASSESSMENT,
    universityId: scope.universityId,
  });
  if (!enabled) return fail({ error: "V2 disabled", status: 404 });

  const { id } = await Promise.resolve(ctx.params);
  const body = await req.json().catch(() => ({}));
  const answers = body.answers && typeof body.answers === "object" ? (body.answers as Record<string, string>) : {};
  const timeTaken = typeof body.timeTaken === "number" && Number.isFinite(body.timeTaken) ? body.timeTaken : 0;
  const focusLossCount = typeof body.focusLossCount === "number" && Number.isFinite(body.focusLossCount) ? body.focusLossCount : 0;
  const loss = Math.max(0, Math.min(10_000, Math.floor(focusLossCount)));

  const paper = await prisma.pastPaper.findUnique({
    where: { id },
    select: { id: true, title: true, semester: { select: { academicYear: { select: { universityId: true } } } } },
  });
  if (!paper) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!isSuperAdmin(scope.role)) {
    if (!scope.universityId) return fail({ error: "Forbidden", status: 403 });
    const uniId = paper.semester.academicYear.universityId;
    if (uniId !== scope.universityId) return fail({ error: "Forbidden", status: 403 });
  }

  const site = await prisma.siteConfig.findFirst({ select: { aiPreferredProvider: true } }).catch(() => null);
  const { aiOptionsFromSiteProvider } = await import("@/lib/site-ai-options");
  const aiOpts = aiOptionsFromSiteProvider(site?.aiPreferredProvider);

  const keys = await loadQuestionAnswerKeysForPastPaper(id);
  const items = await buildQuizAttemptItems(keys, answers, aiOpts);
  const score = computeWeightedQuizPercent(
    keys.map((k) => ({ id: k.id, questionType: k.questionType })),
    items
  );

  const attempt = await prisma.quizAttempt.create({
    data: {
      userId: scope.userId,
      pastPaperId: id,
      score,
      timeTaken,
      focusLossCount: loss,
      items: { create: items },
    },
    select: { id: true },
  });

  return ok({
    tenantKey: scope.universityId,
    actor: { id: scope.userId, role: scope.role ?? "STUDENT" },
    result: { attemptId: attempt.id, score, total: keys.length },
    status: 201,
  });
}
