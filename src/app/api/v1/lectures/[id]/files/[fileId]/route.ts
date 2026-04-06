import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assertLecture, requireAdminWriter } from "@/lib/admin-scope";

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string; fileId: string }> | { id: string; fileId: string } }
) {
  const session = await auth();
  const w = await requireAdminWriter(session);
  if (!w.ok) return w.response;
  const params = await Promise.resolve(ctx.params);
  const boundary = await assertLecture(w.scope, params.id);
  if (boundary) return boundary;

  const body = await req.json().catch(() => ({}));
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });

  const file = await prisma.lectureFile.findFirst({
    where: { id: params.fileId, lectureId: params.id },
    select: { id: true },
  });
  if (!file) return NextResponse.json({ error: "File not found" }, { status: 404 });

  const updated = await prisma.lectureFile.update({
    where: { id: params.fileId },
    data: { name: name.slice(0, 180) },
  });
  return NextResponse.json(updated);
}

export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ id: string; fileId: string }> | { id: string; fileId: string } }
) {
  const session = await auth();
  const w = await requireAdminWriter(session);
  if (!w.ok) return w.response;
  const params = await Promise.resolve(ctx.params);
  const boundary = await assertLecture(w.scope, params.id);
  if (boundary) return boundary;

  const file = await prisma.lectureFile.findFirst({
    where: { id: params.fileId, lectureId: params.id },
    select: { id: true },
  });
  if (!file) return NextResponse.json({ error: "File not found" }, { status: 404 });

  await prisma.lectureFile.delete({ where: { id: params.fileId } });
  return NextResponse.json({ ok: true });
}

