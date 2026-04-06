import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSessionScope, isAdminRole, isSuperAdmin } from "@/lib/tenant";
import { assertSemester, requireAdminWriter } from "@/lib/admin-scope";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const scope = await getSessionScope(session);
  if (!scope) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!scope.universityId) return NextResponse.json({ error: "Set your university in profile first" }, { status: 400 });

  const { searchParams } = new URL(req.url);
  const requestedUni = searchParams.get("universityId")?.trim() || "";
  const universityId = isSuperAdmin(scope.role) && requestedUni ? requestedUni : scope.universityId;

  // Admins see all forums in their university; students see global + their semester + private where member
  const where = isAdminRole(scope.role)
    ? { universityId }
    : {
        universityId,
        OR: [
          { type: "GLOBAL" as const },
          { type: "SEMESTER" as const, semesterId: scope.semesterId ?? undefined },
          { type: "PRIVATE" as const, members: { some: { userId: scope.userId } } },
        ],
        NOT: { status: "CLOSED" as const },
      };

  const forums = await prisma.forum.findMany({
    where,
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { posts: true } } },
  });

  return NextResponse.json(forums);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const w = await requireAdminWriter(session);
  if (!w.ok) return w.response;

  const data = await req.json();
  const { universityId: bodyUniversityId, ...rest } = data as Record<string, unknown> & {
    universityId?: string;
  };

  let universityId: string;
  if (w.isSuper) {
    const fromBody = typeof bodyUniversityId === "string" ? bodyUniversityId.trim() : "";
    universityId = fromBody || w.scope.universityId || "";
    if (!universityId)
      return NextResponse.json({ error: "universityId required for super admin" }, { status: 400 });
    const uni = await prisma.university.findUnique({
      where: { id: universityId },
      select: { id: true },
    });
    if (!uni) return NextResponse.json({ error: "University not found" }, { status: 404 });
  } else {
    if (!w.scope.universityId)
      return NextResponse.json({ error: "Admin must be assigned to a university" }, { status: 403 });
    universityId = w.scope.universityId;
  }

  const semesterIdRaw = rest.semesterId;
  if (!w.isSuper && typeof semesterIdRaw === "string" && semesterIdRaw.trim()) {
    const se = await assertSemester(w.scope, semesterIdRaw.trim());
    if (se) return se;
  }

  const forum = await prisma.forum.create({ data: { ...rest, universityId } as any });
  return NextResponse.json(forum, { status: 201 });
}
