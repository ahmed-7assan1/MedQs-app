import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function isAdmin(role: unknown) {
  return role === "ADMIN" || role === "SUPER_ADMIN";
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  const userId = session?.user?.id;
  const videos = await prisma.lectureVideo.findMany({
    where: { lectureId: params.id },
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

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!isAdmin(role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const url = typeof body?.url === "string" ? body.url.trim() : "";
  if (!title || !url) return NextResponse.json({ error: "title and url are required" }, { status: 400 });

  const sortOrder = await prisma.lectureVideo.count({ where: { lectureId: params.id } });
  const row = await prisma.lectureVideo.create({
    data: {
      lectureId: params.id,
      title,
      url,
      sortOrder: sortOrder + 1,
      sharingEnabled: body?.sharingEnabled !== false,
    },
  });
  return NextResponse.json({ ...row, likedByMe: false }, { status: 201 });
}

