import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assertPastPaper, assertPastPaperCreatePayload, requireAdminWriter } from "@/lib/admin-scope";

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> | { id: string } }) {
  const session = await auth();
  const w = await requireAdminWriter(session);
  if (!w.ok) return w.response;
  const { id } = await Promise.resolve(ctx.params);
  let boundary = await assertPastPaper(w.scope, id);
  if (boundary) return boundary;

  const body = await req.json().catch(() => ({}));
  const data: Record<string, unknown> = {};
  if (typeof body.title === "string") data.title = body.title.trim();
  if (typeof body.isInteractive === "boolean") data.isInteractive = body.isInteractive;
  if (body.timeLimitMin === null || body.timeLimitMin === "")
    data.timeLimitMin = null;
  else if (body.timeLimitMin != null)
    data.timeLimitMin = Math.max(1, parseInt(String(body.timeLimitMin), 10));
  if (typeof body.pdfUrl === "string" || body.pdfUrl === null) data.pdfUrl = body.pdfUrl;
  if (typeof body.aiExplanationEnabled === "boolean") data.aiExplanationEnabled = body.aiExplanationEnabled;
  if (typeof body.allowAiDuringQuiz === "boolean") data.allowAiDuringQuiz = body.allowAiDuringQuiz;
  if (typeof body.secureExamMode === "boolean") data.secureExamMode = body.secureExamMode;
  if (typeof body.restrictCopyPaste === "boolean") data.restrictCopyPaste = body.restrictCopyPaste;
  if (typeof body.trackFocusLoss === "boolean") data.trackFocusLoss = body.trackFocusLoss;

  if (Object.keys(data).length === 0)
    return NextResponse.json({ error: "No valid fields" }, { status: 400 });

  const existing = await prisma.pastPaper.findUnique({
    where: { id },
    select: { semesterId: true, moduleId: true },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const nextSem = typeof data.semesterId === "string" ? data.semesterId : existing.semesterId;
  const nextMod = typeof data.moduleId === "string" ? data.moduleId : existing.moduleId;
  boundary = await assertPastPaperCreatePayload(w.scope, nextSem, nextMod);
  if (boundary) return boundary;

  const paper = await prisma.pastPaper.update({
    where: { id },
    data: data as any,
    include: { module: { select: { name: true } }, _count: { select: { attempts: true } } },
  });
  return NextResponse.json(paper);
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> | { id: string } }) {
  const { id } = await Promise.resolve(ctx.params);
  const paper = await prisma.pastPaper.findUnique({
    where: { id },
    include: { module: { select: { name: true } }, _count: { select: { attempts: true } } },
  });
  if (!paper) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(paper);
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> | { id: string } }) {
  const session = await auth();
  const w = await requireAdminWriter(session);
  if (!w.ok) return w.response;
  const { id } = await Promise.resolve(ctx.params);
  const boundary = await assertPastPaper(w.scope, id);
  if (boundary) return boundary;

  await prisma.pastPaper.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
