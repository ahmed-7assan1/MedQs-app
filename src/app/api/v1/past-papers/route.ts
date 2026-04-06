import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assertPastPaperCreatePayload, requireAdminWriter } from "@/lib/admin-scope";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const semesterId = searchParams.get("semesterId");

  const papers = await prisma.pastPaper.findMany({
    where: semesterId ? { semesterId } : undefined,
    orderBy: { createdAt: "desc" },
    include: {
      module: { select: { name: true } },
      _count: { select: { attempts: true } },
    },
  });

  return NextResponse.json(papers);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const w = await requireAdminWriter(session);
  if (!w.ok) return w.response;

  const body = await req.json();
  const semesterId = String(body.semesterId ?? "");
  const moduleId = String(body.moduleId ?? "");
  const payloadErr = await assertPastPaperCreatePayload(w.scope, semesterId, moduleId);
  if (payloadErr) return payloadErr;

  const paper = await prisma.pastPaper.create({
    data: {
      title: String(body.title ?? "").trim(),
      semesterId: String(body.semesterId ?? ""),
      moduleId: String(body.moduleId ?? ""),
      isInteractive: Boolean(body.isInteractive),
      timeLimitMin:
        body.timeLimitMin != null && body.timeLimitMin !== ""
          ? Math.max(1, parseInt(String(body.timeLimitMin), 10))
          : null,
      pdfUrl: body.pdfUrl ? String(body.pdfUrl) : null,
      aiExplanationEnabled: body.aiExplanationEnabled !== false,
      allowAiDuringQuiz: Boolean(body.allowAiDuringQuiz),
      secureExamMode: Boolean(body.secureExamMode),
      restrictCopyPaste: Boolean(body.restrictCopyPaste),
      trackFocusLoss: Boolean(body.trackFocusLoss),
    },
  });
  return NextResponse.json(paper, { status: 201 });
}
