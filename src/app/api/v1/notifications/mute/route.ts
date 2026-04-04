import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const mute = await prisma.notificationMute.findFirst({
    where: { userId: session.user.id },
  });
  return NextResponse.json(mute ?? { muteAll: false, muteForum: false });
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const data = await req.json();
  const existing = await prisma.notificationMute.findFirst({ where: { userId: session.user.id } });

  const mute = existing
    ? await prisma.notificationMute.update({ where: { id: existing.id }, data })
    : await prisma.notificationMute.create({ data: { userId: session.user.id, ...data } });

  return NextResponse.json(mute);
}
