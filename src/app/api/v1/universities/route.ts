import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireAdminWriter } from "@/lib/admin-scope";
import { getSessionScope, isAdminRole, isSuperAdmin } from "@/lib/tenant";

// GET /api/v1/universities
export async function GET() {
  const session = await auth();
  const scope = session ? await getSessionScope(session) : null;
  if (scope && isAdminRole(scope.role) && !isSuperAdmin(scope.role)) {
    if (!scope.universityId) return NextResponse.json([]);
    const unis = await prisma.university.findMany({
      where: { id: scope.universityId },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(unis);
  }
  const unis = await prisma.university.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(unis);
}

// POST /api/v1/universities
export async function POST(req: NextRequest) {
  const session = await auth();
  const w = await requireAdminWriter(session);
  if (!w.ok) return w.response;
  if (!w.isSuper) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { name, logoUrl } = await req.json();
  const uni = await prisma.university.create({ data: { name, logoUrl } });
  return NextResponse.json(uni, { status: 201 });
}
