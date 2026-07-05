import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSessionScope } from "@/lib/tenant";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const scope = await getSessionScope(session);
  if (!scope?.universityId) return NextResponse.json({ error: "No university" }, { status: 403 });

  const activeSessions = await prisma.studySession.findMany({
    where: {
      status: { in: ["WAITING", "ACTIVE", "PAUSED"] },
      room: {
        isPublic: true,
        universityId: scope.universityId,
      },
    },
    include: {
      room: { select: { id: true, name: true, image: true } },
      startedBy: { select: { id: true, name: true, image: true } },
      _count: { select: { participants: true } },
    },
    orderBy: { startedAt: "desc" },
    take: 10,
  });

  return NextResponse.json(activeSessions);
}
