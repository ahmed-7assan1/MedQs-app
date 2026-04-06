import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSessionScope, isAdminRole, isSuperAdmin } from "@/lib/tenant";

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
  const scope = await getSessionScope(session);
  if (!scope) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdminRole(scope.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!scope.universityId) return NextResponse.json({ error: "Set your university in profile first" }, { status: 400 });

  const data = await req.json();
  // Force tenant boundary
  const forum = await prisma.forum.create({ data: { ...data, universityId: scope.universityId } });
  return NextResponse.json(forum, { status: 201 });
}
