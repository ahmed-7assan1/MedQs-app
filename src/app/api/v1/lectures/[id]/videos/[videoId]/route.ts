import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function isAdmin(role: unknown) {
  return role === "ADMIN" || role === "SUPER_ADMIN";
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; videoId: string } }
) {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!isAdmin(role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

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
  { params }: { params: { id: string; videoId: string } }
) {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!isAdmin(role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const existing = await prisma.lectureVideo.findFirst({
    where: { id: params.videoId, lectureId: params.id },
    select: { id: true },
  });
  if (!existing) return NextResponse.json({ error: "Video not found" }, { status: 404 });

  await prisma.lectureVideo.delete({ where: { id: params.videoId } });
  return NextResponse.json({ ok: true });
}

