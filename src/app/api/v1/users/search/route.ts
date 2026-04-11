import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSessionScope, isSuperAdmin } from "@/lib/tenant";

export async function GET(req: NextRequest) {
  const session = await auth();
  const scope = await getSessionScope(session);
  if (!scope?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isSuperAdmin(scope.role) && !scope.universityId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();
  if (q.length < 2) return NextResponse.json([]);

  const users = await prisma.user.findMany({
    where: {
      id: { not: scope.userId },
      ...(isSuperAdmin(scope.role) ? {} : { universityId: scope.universityId! }),
      OR: [
        { nickname: { contains: q, mode: "insensitive" } },
        { studentId: { contains: q, mode: "insensitive" } },
        { name: { contains: q, mode: "insensitive" } },
      ],
    },
    select: { id: true, name: true, nickname: true, studentId: true, image: true },
    take: 8,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(users);
}
