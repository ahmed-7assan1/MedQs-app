import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: { semesterId: string } }) {
  const modules = await prisma.module.findMany({
    where: { semesterId: params.semesterId },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(modules);
}

export async function POST(req: NextRequest, { params }: { params: { semesterId: string } }) {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (role !== "ADMIN" && role !== "SUPER_ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { name } = await req.json();
  const module = await prisma.module.create({
    data: { name, semesterId: params.semesterId },
  });
  return NextResponse.json(module, { status: 201 });
}
