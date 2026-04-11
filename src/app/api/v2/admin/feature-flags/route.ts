import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireAdminWriter } from "@/lib/admin-scope";
import { isSuperAdmin } from "@/lib/tenant";
import { ok, fail } from "@/platform/api/envelope";
import { devBypassFromRequest } from "@/platform/dev-auth";

// Admin can manage flags only within their university. Super admin can set global.
export async function PUT(req: NextRequest) {
  const dev = devBypassFromRequest(req);
  if (dev) {
    const body = await req.json().catch(() => ({}));
    const key = typeof body.key === "string" ? body.key.trim() : "";
    const enabled = Boolean(body.enabled);
    const scopeMode = typeof body.scope === "string" ? body.scope : "university";
    if (!key) return fail({ error: "key required", status: 400 });

    const universityId = scopeMode === "global" ? null : dev.universityId;
    if (universityId == null) {
      return NextResponse.json({ error: "Global flags require super admin" }, { status: 403 });
    }

    const existing = await prisma.featureFlag.findFirst({ where: { universityId, key }, select: { id: true } });
    const row = existing
      ? await prisma.featureFlag.update({
          where: { id: existing.id },
          data: { enabled, payload: body.payload ?? undefined },
          select: { id: true, universityId: true, key: true, enabled: true, updatedAt: true },
        })
      : await prisma.featureFlag.create({
          data: { universityId, key, enabled, payload: body.payload ?? undefined },
          select: { id: true, universityId: true, key: true, enabled: true, updatedAt: true },
        });

    return ok({ tenantKey: universityId, actor: { id: dev.actorUserId, role: dev.role }, result: row });
  }

  const session = await auth();
  const w = await requireAdminWriter(session);
  if (!w.ok) return w.response;
  const actor = { id: w.scope.userId, role: w.scope.role ?? "STUDENT" };

  const body = await req.json().catch(() => ({}));
  const key = typeof body.key === "string" ? body.key.trim() : "";
  const enabled = Boolean(body.enabled);
  const scopeMode = typeof body.scope === "string" ? body.scope : "university";

  if (!key) return fail({ error: "key required", status: 400 });

  const universityId =
    scopeMode === "global"
      ? null
      : w.scope.universityId;

  if (universityId == null && !isSuperAdmin(w.scope.role)) {
    return NextResponse.json({ error: "Global flags require super admin" }, { status: 403 });
  }
  if (universityId == null && scopeMode !== "global") {
    return NextResponse.json({ error: "Admin must be assigned to a university" }, { status: 403 });
  }

  const existing = await prisma.featureFlag.findFirst({
    where: { universityId, key },
    select: { id: true },
  });

  const row = existing
    ? await prisma.featureFlag.update({
        where: { id: existing.id },
        data: { enabled, payload: body.payload ?? undefined },
        select: { id: true, universityId: true, key: true, enabled: true, updatedAt: true },
      })
    : await prisma.featureFlag.create({
        data: { universityId, key, enabled, payload: body.payload ?? undefined },
        select: { id: true, universityId: true, key: true, enabled: true, updatedAt: true },
      });

  return ok({ tenantKey: universityId, actor, result: row });
}
