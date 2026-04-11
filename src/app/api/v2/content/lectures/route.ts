import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireAdminWriter, assertSubject } from "@/lib/admin-scope";
import { ok, fail } from "@/platform/api/envelope";
import { FLAG_V2_ORG_CONTENT_ASSESSMENT, requireFeatureEnabled } from "@/platform/flags";
import { devBypassFromRequest } from "@/platform/dev-auth";
import { getSessionScope } from "@/lib/tenant";

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
  const subjectId = typeof body.subjectId === "string" ? body.subjectId : "";
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const order = typeof body.order === "number" && Number.isFinite(body.order) ? Math.max(0, Math.floor(body.order)) : 0;
  if (!subjectId || !title) return fail({ error: "subjectId and title required", status: 400 });

  const boundary = await assertSubject(scope as any, subjectId);
  if (boundary) return boundary;

  const lecture = await prisma.lecture.create({
    data: { subjectId, title, order },
    select: { id: true, title: true, subjectId: true, order: true },
  });

  return ok({
    tenantKey: scope.universityId,
    actor: { id: scope.userId, role: scope.role ?? "STUDENT" },
    result: lecture,
    status: 201,
  });
}
