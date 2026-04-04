import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { broadcastNotification } from "@/lib/redis";

// PUT /api/v1/notifications/read-all
export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.notification.updateMany({
    where: { userId: session.user.id, read: false },
    data: { read: true },
  });

  return NextResponse.json({ ok: true });
}

// POST /api/v1/notifications/broadcast  (admin only)
export async function POST(req: NextRequest) {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (role !== "ADMIN" && role !== "SUPER_ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { title, body, semesterId } = await req.json();

  const users = await prisma.user.findMany({
    where: semesterId ? { semesterId } : undefined,
    select: { id: true },
  });

  const userIds = users.map((u) => u.id);

  await prisma.notification.createMany({
    data: userIds.map((userId) => ({
      userId,
      title,
      body,
      channel: "BROADCAST",
    })),
  });

  await broadcastNotification(userIds, { title, body, channel: "BROADCAST" });

  return NextResponse.json({ sent: userIds.length });
}
