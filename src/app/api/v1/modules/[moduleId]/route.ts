import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assertModule, requireAdminWriter } from "@/lib/admin-scope";
import { deleteModuleCascade } from "@/lib/admin-delete-structure";

export async function PUT(
  req: NextRequest,
  ctx: { params: Promise<{ moduleId: string }> | { moduleId: string } }
) {
  const session = await auth();
  const w = await requireAdminWriter(session);
  if (!w.ok) return w.response;
  const { moduleId } = await Promise.resolve(ctx.params);
  const boundary = await assertModule(w.scope, moduleId);
  if (boundary) return boundary;

  const { name } = await req.json();
  if (!name?.trim())
    return NextResponse.json({ error: "Name required" }, { status: 400 });

  const module = await prisma.module.update({
    where: { id: moduleId },
    data: { name: name.trim() },
  });
  return NextResponse.json(module);
}

export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ moduleId: string }> | { moduleId: string } }
) {
  const session = await auth();
  const w = await requireAdminWriter(session);
  if (!w.ok) return w.response;
  const { moduleId } = await Promise.resolve(ctx.params);
  const boundary = await assertModule(w.scope, moduleId);
  if (boundary) return boundary;

  try {
    await prisma.$transaction((tx) => deleteModuleCascade(tx, moduleId));
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[DELETE module]", e);
    const msg = e instanceof Error ? e.message : "Delete failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
