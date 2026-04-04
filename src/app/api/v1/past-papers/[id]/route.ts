import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (role !== "ADMIN" && role !== "SUPER_ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

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

  if (Object.keys(data).length === 0)
    return NextResponse.json({ error: "No valid fields" }, { status: 400 });

  const paper = await prisma.pastPaper.update({
    where: { id: params.id },
    data: data as any,
    include: { module: { select: { name: true } }, _count: { select: { attempts: true } } },
  });
  return NextResponse.json(paper);
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const paper = await prisma.pastPaper.findUnique({
    where: { id: params.id },
    include: { module: { select: { name: true } }, _count: { select: { attempts: true } } },
  });
  if (!paper) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(paper);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (role !== "ADMIN" && role !== "SUPER_ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.pastPaper.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
