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
  if (typeof body.googleSheetsSyncEnabled === "boolean") data.googleSheetsSyncEnabled = body.googleSheetsSyncEnabled;

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

  let paper: any;
  try {
    paper = await prisma.pastPaper.update({
      where: { id },
      data: data as any,
      include: {
        module: { select: { name: true } },
        _count: { select: { attempts: true } },
      },
    });
  } catch {
    const legacyData = { ...(data as any) };
    delete legacyData.googleSheetsSyncEnabled;
    paper = await prisma.pastPaper.update({
      where: { id },
      data: legacyData,
      include: {
        module: { select: { name: true } },
        _count: { select: { attempts: true } },
      },
    });
    paper = { ...paper, googleSheetsSyncEnabled: false, _count: { ...paper._count } };
  }
  return NextResponse.json(paper);
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> | { id: string } }) {
  const { id } = await Promise.resolve(ctx.params);
  let paper: any;
  try {
    paper = await prisma.pastPaper.findUnique({
      where: { id },
      include: {
        module: { select: { name: true } },
        _count: { select: { attempts: true } },
      },
    });
  } catch {
    paper = await prisma.pastPaper.findUnique({
      where: { id },
      include: {
        module: { select: { name: true } },
        _count: { select: { attempts: true } },
      },
    });
    if (paper) {
      paper = { ...paper, googleSheetsSyncEnabled: false, _count: { ...paper._count } };
    }
  }
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

  try {
    await prisma.$transaction(async (tx) => {
      // Delete quiz attempts + items for this paper
      const attempts = await tx.quizAttempt.findMany({
        where: { pastPaperId: id },
        select: { id: true },
      });
      const attemptIds = attempts.map((a) => a.id);
      if (attemptIds.length > 0) {
        await tx.quizAttemptItem.deleteMany({ where: { attemptId: { in: attemptIds } } });
        await tx.quizAttempt.deleteMany({ where: { id: { in: attemptIds } } });
      }

      // Question reports that reference this paper
      await tx.questionReport.deleteMany({ where: { pastPaperId: id } });

      // Explicit linked questions (if schema is migrated)
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const anyTx = tx as any;
        if (anyTx.pastPaperQuestion?.deleteMany) {
          await anyTx.pastPaperQuestion.deleteMany({ where: { pastPaperId: id } });
        }
      } catch {
        // Ignore if model/table does not exist yet (pre-migration).
      }

      await tx.pastPaper.delete({ where: { id } });
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[past-papers DELETE]", e);
    return NextResponse.json(
      { error: "Failed to delete past paper. Check DB constraints or migrations." },
      { status: 500 }
    );
  }
}
