import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assertSemester, requireAdminWriter } from "@/lib/admin-scope";
import { getSessionScope, isSuperAdmin } from "@/lib/tenant";

export async function GET(req: NextRequest, { params }: { params: { semesterId: string } }) {
  const session = await auth();
  const scope = await getSessionScope(session);
  if (!scope) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isSuperAdmin(scope.role) && !scope.universityId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Enforce tenant isolation for reads.
  if (!isSuperAdmin(scope.role)) {
    const semErr = await assertSemester(scope as any, params.semesterId);
    if (semErr) return semErr;
  }

  const modules = await prisma.module.findMany({
    where: { semesterId: params.semesterId },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(modules);
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ semesterId: string }> | { semesterId: string } }
) {
  const session = await auth();
  const w = await requireAdminWriter(session);
  if (!w.ok) return w.response;
  const { semesterId } = await Promise.resolve(ctx.params);
  const boundary = await assertSemester(w.scope, semesterId);
  if (boundary) return boundary;

  const { name } = await req.json();
  const createdModule = await prisma.module.create({
    data: { name, semesterId },
  });
  return NextResponse.json(createdModule, { status: 201 });
}
