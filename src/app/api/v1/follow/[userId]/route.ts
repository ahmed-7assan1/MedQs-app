import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSessionScope } from "@/lib/tenant";

export async function GET(_req: NextRequest, { params }: { params: { userId: string } }) {
  const session = await auth();
  const scope = await getSessionScope(session);
  if (!scope) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const targetId = String(params.userId ?? "").trim();
  if (!targetId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  if (targetId === scope.userId) return NextResponse.json({ following: false });

  const target = await prisma.user.findUnique({ where: { id: targetId }, select: { universityId: true } });
  if (!target?.universityId || !scope.universityId) return NextResponse.json({ error: "University required" }, { status: 400 });
  if (target.universityId !== scope.universityId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const row = await prisma.userFollow.findUnique({
    where: { followerId_followingId: { followerId: scope.userId, followingId: targetId } },
    select: { id: true },
  });
  return NextResponse.json({ following: Boolean(row) });
}

export async function POST(_req: NextRequest, { params }: { params: { userId: string } }) {
  const session = await auth();
  const scope = await getSessionScope(session);
  if (!scope) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const targetId = String(params.userId ?? "").trim();
  if (!targetId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  if (targetId === scope.userId) return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 });

  const target = await prisma.user.findUnique({ where: { id: targetId }, select: { universityId: true } });
  if (!target?.universityId || !scope.universityId) return NextResponse.json({ error: "University required" }, { status: 400 });
  if (target.universityId !== scope.universityId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const existing = await prisma.userFollow.findUnique({
    where: { followerId_followingId: { followerId: scope.userId, followingId: targetId } },
    select: { id: true },
  });

  if (existing) {
    await prisma.userFollow.delete({ where: { id: existing.id } });
    return NextResponse.json({ following: false });
  }

  await prisma.userFollow.create({ data: { followerId: scope.userId, followingId: targetId } });
  return NextResponse.json({ following: true });
}

