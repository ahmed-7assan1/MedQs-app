import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assertLecture, assertQuestion, requireAdminWriter } from "@/lib/admin-scope";

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> | { id: string } }) {
  const { id } = await Promise.resolve(ctx.params);
  const q = await prisma.question.findUnique({ where: { id } });
  if (!q) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(q);
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> | { id: string } }) {
  const session = await auth();
  const w = await requireAdminWriter(session);
  if (!w.ok) return w.response;
  const { id } = await Promise.resolve(ctx.params);
  const boundary = await assertQuestion(w.scope, id);
  if (boundary) return boundary;

  const data = await req.json();
  if (typeof data?.lectureId === "string") {
    const lb = await assertLecture(w.scope, data.lectureId);
    if (lb) return lb;
  }
  const q = await prisma.question.update({ where: { id }, data });
  return NextResponse.json(q);
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> | { id: string } }) {
  const session = await auth();
  const w = await requireAdminWriter(session);
  if (!w.ok) return w.response;
  const { id } = await Promise.resolve(ctx.params);
  const boundary = await assertQuestion(w.scope, id);
  if (boundary) return boundary;

  await prisma.question.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
