import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assertSubject, requireAdminWriter } from "@/lib/admin-scope";

export async function PUT(
  req: NextRequest,
  ctx: { params: Promise<{ subjectId: string }> | { subjectId: string } }
) {
  const session = await auth();
  const w = await requireAdminWriter(session);
  if (!w.ok) return w.response;
  const { subjectId } = await Promise.resolve(ctx.params);
  const boundary = await assertSubject(w.scope, subjectId);
  if (boundary) return boundary;

  const { name } = await req.json();
  if (!name?.trim())
    return NextResponse.json({ error: "Name required" }, { status: 400 });

  const subject = await prisma.subject.update({
    where: { id: subjectId },
    data: { name: name.trim() },
  });
  return NextResponse.json(subject);
}

export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ subjectId: string }> | { subjectId: string } }
) {
  const session = await auth();
  const w = await requireAdminWriter(session);
  if (!w.ok) return w.response;
  const { subjectId } = await Promise.resolve(ctx.params);
  const boundary = await assertSubject(w.scope, subjectId);
  if (boundary) return boundary;

  try {
    // DB must allow deleting questions still referenced by QuizAttemptItem (see schema onDelete: Cascade)
    await prisma.subject.delete({ where: { id: subjectId } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[DELETE subject]", e);
    const msg = e instanceof Error ? e.message : "Delete failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
