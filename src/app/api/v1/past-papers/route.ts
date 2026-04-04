import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const semesterId = searchParams.get("semesterId");

  const papers = await prisma.pastPaper.findMany({
    where: semesterId ? { semesterId } : undefined,
    orderBy: { createdAt: "desc" },
    include: {
      module: { select: { name: true } },
      _count: { select: { attempts: true } },
    },
  });

  return NextResponse.json(papers);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (role !== "ADMIN" && role !== "SUPER_ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const data = await req.json();
  const paper = await prisma.pastPaper.create({ data });
  return NextResponse.json(paper, { status: 201 });
}
