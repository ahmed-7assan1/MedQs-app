import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { broadcastNotification } from "@/lib/redis";
import { assertSemester, requireAdminWriter } from "@/lib/admin-scope";

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
  const w = await requireAdminWriter(session);
  if (!w.ok) return w.response;

  const { title, body, semesterId } = await req.json();

  let userWhere: { semesterId?: string; universityId?: string } = {};
  if (semesterId) {
    const err = await assertSemester(w.scope, String(semesterId));
    if (err) return err;
    userWhere = { semesterId: String(semesterId) };
  } else if (!w.isSuper) {
    if (!w.scope.universityId)
      return NextResponse.json({ error: "Admin must be assigned to a university" }, { status: 403 });
    userWhere = { universityId: w.scope.universityId };
  }

  const users = await prisma.user.findMany({
    where: Object.keys(userWhere).length ? userWhere : undefined,
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
