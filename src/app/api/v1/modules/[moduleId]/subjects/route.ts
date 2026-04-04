import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { moduleId: string } }
) {
  const subjects = await prisma.subject.findMany({
    where: { moduleId: params.moduleId },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(subjects);
}

export async function POST(
  req: NextRequest,
  { params }: { params: { moduleId: string } }
) {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (role !== "ADMIN" && role !== "SUPER_ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { name } = await req.json();
  if (!name?.trim())
    return NextResponse.json({ error: "Name required" }, { status: 400 });

  const subject = await prisma.subject.create({
    data: { name, moduleId: params.moduleId },
  });
  return NextResponse.json(subject, { status: 201 });
}
