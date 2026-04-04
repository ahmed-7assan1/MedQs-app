import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
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

  const module = await prisma.module.update({
    where: { id: params.moduleId },
    data: { name: name.trim() },
  });
  return NextResponse.json(module);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { moduleId: string } }
) {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (role !== "ADMIN" && role !== "SUPER_ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.module.delete({ where: { id: params.moduleId } });
  return NextResponse.json({ ok: true });
}
