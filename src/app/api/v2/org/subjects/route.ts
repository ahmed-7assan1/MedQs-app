import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireAdminWriter, assertModule } from "@/lib/admin-scope";
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
  if (!enabled) return fail({ error: "V2 disabled", status: 404, tenantKey: scope.universityId, actor: { id: scope.userId, role: scope.role ?? "STUDENT" } });

  const body = await req.json().catch(() => ({}));
  const moduleId = typeof body.moduleId === "string" ? body.moduleId : "";
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!moduleId || !name) return fail({ error: "moduleId and name required", status: 400 });

  const boundary = await assertModule(scope as any, moduleId);
  if (boundary) return boundary;

  const subject = await prisma.subject.create({
    data: { moduleId, name },
    select: { id: true, name: true, moduleId: true },
  });

  return ok({
    tenantKey: scope.universityId,
    actor: { id: scope.userId, role: scope.role ?? "STUDENT" },
    result: subject,
    status: 201,
  });
}
