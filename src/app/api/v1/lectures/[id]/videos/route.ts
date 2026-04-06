import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assertLecture, requireAdminWriter } from "@/lib/admin-scope";

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> | { id: string } }) {
  const session = await auth();
  const userId = session?.user?.id;
  const { id } = await Promise.resolve(ctx.params);
  const videos = await prisma.lectureVideo.findMany({
    where: { lectureId: id },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    include: {
      likes: userId ? { where: { userId }, select: { id: true } } : false,
    },
  });
  return NextResponse.json(
    videos.map((v) => ({
      ...v,
      likedByMe: userId ? (v.likes as { id: string }[]).length > 0 : false,
      likes: undefined,
    }))
  );
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> | { id: string } }) {
  const session = await auth();
  const w = await requireAdminWriter(session);
  if (!w.ok) return w.response;
  const { id } = await Promise.resolve(ctx.params);
  const boundary = await assertLecture(w.scope, id);
  if (boundary) return boundary;

  const body = await req.json().catch(() => ({}));
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const url = typeof body?.url === "string" ? body.url.trim() : "";
  if (!title || !url) return NextResponse.json({ error: "title and url are required" }, { status: 400 });

  const sortOrder = await prisma.lectureVideo.count({ where: { lectureId: id } });
  const row = await prisma.lectureVideo.create({
    data: {
      lectureId: id,
      title,
      url,
      sortOrder: sortOrder + 1,
      sharingEnabled: body?.sharingEnabled !== false,
    },
  });
  return NextResponse.json({ ...row, likedByMe: false }, { status: 201 });
}

