import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ONLINE_THRESHOLD_MS = 2 * 60 * 1000; // 2 minutes

// POST — heartbeat: update lastSeenAt
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.user.update({
    where: { id: session.user.id },
    data: { lastSeenAt: new Date() },
  });

  return NextResponse.json({ success: true });
}

// GET — check online status for given user IDs
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const userIdsParam = searchParams.get("userIds");
  if (!userIdsParam) return NextResponse.json({ error: "userIds query param required" }, { status: 400 });

  const userIds = userIdsParam.split(",").filter(Boolean);

  // Check requesting user's hideOnlineStatus
  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { hideOnlineStatus: true },
  });

  if (currentUser?.hideOnlineStatus) {
    // If user hid their own status, they can't see others either
    const allOffline = userIds.reduce((acc, id) => ({ ...acc, [id]: false }), {} as Record<string, boolean>);
    return NextResponse.json(allOffline);
  }

  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, lastSeenAt: true, hideOnlineStatus: true },
  });

  const now = Date.now();
  const result: Record<string, boolean> = {};
  for (const u of users) {
    if (u.hideOnlineStatus) {
      result[u.id] = false;
    } else {
      result[u.id] = u.lastSeenAt ? (now - u.lastSeenAt.getTime()) < ONLINE_THRESHOLD_MS : false;
    }
  }

  return NextResponse.json(result);
}
