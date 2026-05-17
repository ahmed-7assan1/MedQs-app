import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSessionScope, isAdminRole, isSuperAdmin } from "@/lib/tenant";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  const scope = await getSessionScope(session);
  if (!scope) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdminRole(scope.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { classification, leaderId } = body;

  let updateData: any = {};

  if (classification === "SUPER_ADMIN") {
    if (!isSuperAdmin(scope.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    updateData = { role: "SUPER_ADMIN", isLeader: false, leaderId: null };
  } else if (classification === "ADMIN") {
    updateData = { role: "ADMIN", isLeader: false, leaderId: null };
  } else if (classification === "TEAM_LEADER") {
    updateData = { role: "STUDENT", isLeader: true, leaderId: null };
  } else if (classification === "TEAM_ADMIN") {
    updateData = { role: "STUDENT", isLeader: false, leaderId: leaderId || null };
  } else if (classification === "STUDENT") {
    updateData = { role: "STUDENT", isLeader: false, leaderId: null };
  } else {
    return NextResponse.json({ error: "Invalid classification" }, { status: 400 });
  }

  if (!isSuperAdmin(scope.role)) {
    if (!scope.universityId) return NextResponse.json({ error: "Admin university not set" }, { status: 400 });
    const target = await prisma.user.findUnique({ where: { id: params.id }, select: { universityId: true } });
    if (!target?.universityId || target.universityId !== scope.universityId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const updated = await prisma.user.update({
    where: { id: params.id },
    data: updateData,
    select: { id: true, role: true, isLeader: true, leaderId: true },
  });

  return NextResponse.json(updated);
}
