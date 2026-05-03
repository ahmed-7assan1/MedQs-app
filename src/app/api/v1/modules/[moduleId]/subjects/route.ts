import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assertModule, requireAdminWriter } from "@/lib/admin-scope";
import { getSessionScope, isSuperAdmin } from "@/lib/tenant";

export async function GET(
  req: NextRequest,
  { params }: { params: { moduleId: string } }
) {
  const session = await auth();
  const scope = await getSessionScope(session);
  if (!scope) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isSuperAdmin(scope.role) && !scope.universityId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (!isSuperAdmin(scope.role)) {
    const modErr = await assertModule(scope as any, params.moduleId);
    if (modErr) return modErr;
  }

  const subjects = await prisma.subject.findMany({
    where: { moduleId: params.moduleId },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(subjects);
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ moduleId: string }> | { moduleId: string } }
) {
  const session = await auth();
  const w = await requireAdminWriter(session);
  if (!w.ok) return w.response;
  const { moduleId } = await Promise.resolve(ctx.params);
  const boundary = await assertModule(w.scope, moduleId);
  if (boundary) return boundary;

  const { name, icon } = await req.json();
  if (!name?.trim())
    return NextResponse.json({ error: "Name required" }, { status: 400 });

  const subject = await prisma.subject.create({
    data: { 
      name: name.trim(), 
      moduleId,
      icon: icon || null
    },
  });
  return NextResponse.json(subject, { status: 201 });
}
