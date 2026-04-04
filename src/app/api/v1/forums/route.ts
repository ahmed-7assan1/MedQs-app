import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { semesterId: true, role: true },
  });

  // Admins see all; students see global + their semester
  const where =
    user?.role === "ADMIN" || user?.role === "SUPER_ADMIN"
      ? {}
      : {
          OR: [
            { type: "GLOBAL" as const },
            { type: "SEMESTER" as const, semesterId: user?.semesterId ?? undefined },
            { type: "SEMESTER" as const, semesterId: null },
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
  const role = (session?.user as any)?.role;
  if (role !== "ADMIN" && role !== "SUPER_ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const data = await req.json();
  const forum = await prisma.forum.create({ data });
  return NextResponse.json(forum, { status: 201 });
}
