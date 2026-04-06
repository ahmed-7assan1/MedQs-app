import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assertLecture, requireAdminWriter } from "@/lib/admin-scope";

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string; videoId: string }> | { id: string; videoId: string } }
) {
  const session = await auth();
  const w = await requireAdminWriter(session);
  if (!w.ok) return w.response;
  const params = await Promise.resolve(ctx.params);
  const boundary = await assertLecture(w.scope, params.id);
  if (boundary) return boundary;

  const payload = await req.json().catch(() => ({}));
  const data: {
    title?: string;
    url?: string;
    sharingEnabled?: boolean;
    sortOrder?: number;
  } = {};
  if (typeof payload?.title === "string" && payload.title.trim()) data.title = payload.title.trim();
  if (typeof payload?.url === "string" && payload.url.trim()) data.url = payload.url.trim();
  if (typeof payload?.sharingEnabled === "boolean") data.sharingEnabled = payload.sharingEnabled;
  if (typeof payload?.sortOrder === "number" && Number.isFinite(payload.sortOrder)) data.sortOrder = payload.sortOrder;
  if (Object.keys(data).length === 0) return NextResponse.json({ error: "No valid fields" }, { status: 400 });

  const existing = await prisma.lectureVideo.findFirst({
    where: { id: params.videoId, lectureId: params.id },
    select: { id: true },
  });
  if (!existing) return NextResponse.json({ error: "Video not found" }, { status: 404 });

  const updated = await prisma.lectureVideo.update({ where: { id: params.videoId }, data });
  return NextResponse.json(updated);
}

export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ id: string; videoId: string }> | { id: string; videoId: string } }
) {
  const session = await auth();
  const w = await requireAdminWriter(session);
  if (!w.ok) return w.response;
  const params = await Promise.resolve(ctx.params);
  const boundary = await assertLecture(w.scope, params.id);
  if (boundary) return boundary;

  const existing = await prisma.lectureVideo.findFirst({
    where: { id: params.videoId, lectureId: params.id },
    select: { id: true },
  });
  if (!existing) return NextResponse.json({ error: "Video not found" }, { status: 404 });

  await prisma.lectureVideo.delete({ where: { id: params.videoId } });
  return NextResponse.json({ ok: true });
}

