import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { blockedId } = body;

  if (!blockedId) return NextResponse.json({ error: "blockedId required" }, { status: 400 });
  if (blockedId === session.user.id) return NextResponse.json({ error: "Cannot block yourself" }, { status: 400 });

  const existing = await prisma.blockedUser.findUnique({
    where: { userId_blockedId: { userId: session.user.id, blockedId } },
  });

  if (existing) {
    await prisma.blockedUser.delete({ where: { id: existing.id } });
    return NextResponse.json({ blocked: false });
  }

  await prisma.blockedUser.create({
    data: { userId: session.user.id, blockedId },
  });

  return NextResponse.json({ blocked: true });
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const blocked = await prisma.blockedUser.findMany({
    where: { userId: session.user.id },
    include: {
      blocked: { select: { id: true, name: true, image: true, handle: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ blocked });
}
