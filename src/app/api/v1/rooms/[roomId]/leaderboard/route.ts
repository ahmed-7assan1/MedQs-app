import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSessionScope } from "@/lib/tenant";
export const dynamic = "force-dynamic";

type Params = { params: { roomId: string } };

export async function GET(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const scope = await getSessionScope(session);
  if (!scope) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const members = await prisma.studyRoomMember.findMany({
    where: { roomId: params.roomId },
    include: {
      user: {
        select: { id: true, name: true, image: true, points: true, rank: { select: { label: true, badge: true } } },
      },
    },
  });

  const leaderboard = members
    .map((m) => ({ ...m.user, role: m.role, joinedAt: m.joinedAt }))
    .sort((a, b) => (b.points ?? 0) - (a.points ?? 0));

  return NextResponse.json(leaderboard);
}
