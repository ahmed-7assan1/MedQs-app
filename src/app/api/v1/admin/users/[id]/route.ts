import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSessionScope, isAdminRole, isSuperAdmin } from "@/lib/tenant";

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  const scope = await getSessionScope(session);
  if (!scope) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdminRole(scope.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Prevent self-deletion
  if (params.id === session?.user?.id)
    return NextResponse.json({ error: "Cannot delete yourself" }, { status: 400 });

  if (!isSuperAdmin(scope.role)) {
    if (!scope.universityId) return NextResponse.json({ error: "Admin university not set" }, { status: 400 });
    const target = await prisma.user.findUnique({ where: { id: params.id }, select: { universityId: true } });
    if (!target?.universityId || target.universityId !== scope.universityId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  await prisma.user.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
