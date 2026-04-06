import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assertSemester, requireAdminWriter } from "@/lib/admin-scope";

export async function GET(req: NextRequest, { params }: { params: { semesterId: string } }) {
  const modules = await prisma.module.findMany({
    where: { semesterId: params.semesterId },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(modules);
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ semesterId: string }> | { semesterId: string } }
) {
  const session = await auth();
  const w = await requireAdminWriter(session);
  if (!w.ok) return w.response;
  const { semesterId } = await Promise.resolve(ctx.params);
  const boundary = await assertSemester(w.scope, semesterId);
  if (boundary) return boundary;

  const { name } = await req.json();
  const module = await prisma.module.create({
    data: { name, semesterId },
  });
  return NextResponse.json(module, { status: 201 });
}
