import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSessionScope } from "@/lib/tenant";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const scope = await getSessionScope(session);
  if (!scope?.universityId) return NextResponse.json({ error: "No university" }, { status: 403 });

  const { universityId, userId } = scope;

  const excludeIds = [userId];

  // Exclude users already in a group with current user
  const groupMemberIds = await prisma.groupMember.findMany({
    where: { userId },
    select: { group: { select: { members: { select: { userId: true } } } } },
  });
  for (const gm of groupMemberIds) {
    for (const m of gm.group.members) {
      if (!excludeIds.includes(m.userId)) excludeIds.push(m.userId);
    }
  }

  const users = await prisma.user.findMany({
    where: {
      universityId,
      id: { notIn: excludeIds },
    },
    select: {
      id: true, name: true, image: true, lastSeenAt: true, hideOnlineStatus: true,
    },
    orderBy: { createdAt: "desc" },
    take: 6,
  });

  const now = Date.now();
  const result = users.map(u => ({
    ...u,
    isOnline: u.hideOnlineStatus ? false : (u.lastSeenAt ? (now - u.lastSeenAt.getTime()) < 120000 : false),
  }));

  return NextResponse.json(result);
}
