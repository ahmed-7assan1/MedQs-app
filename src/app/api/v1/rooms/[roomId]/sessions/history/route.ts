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

  const history = await prisma.studySession.findMany({
    where: {
      roomId: params.roomId,
      status: { in: ["COMPLETED", "CANCELLED"] },
    },
    orderBy: { endedAt: "desc" },
    take: 50,
    include: {
      startedBy: { select: { id: true, name: true, image: true } },
      participants: {
        include: {
          user: { select: { id: true, name: true, image: true } },
        },
      },
    },
  });

  const pointsMap = await prisma.userPointsTransaction.findMany({
    where: {
      roomId: params.roomId,
      reference: { in: history.map((s) => s.id) },
      reason: "session_completed",
    },
    select: { reference: true, userId: true, points: true },
  });

  const pointsBySession: Record<string, number> = {};
  for (const p of pointsMap) {
    pointsBySession[p.reference!] = (pointsBySession[p.reference!] || 0) + p.points;
  }

  const enriched = history.map((s) => ({
    ...s,
    totalPauseMs: Number(s.totalPauseMs),
    totalPointsAwarded: pointsBySession[s.id] ?? 0,
  }));

  return NextResponse.json(enriched);
}
