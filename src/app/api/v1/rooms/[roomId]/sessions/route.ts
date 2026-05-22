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

  const sessions = await prisma.studySession.findMany({
    where: { roomId: params.roomId },
    orderBy: { startedAt: "desc" },
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

  return NextResponse.json(sessions);
}

export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const scope = await getSessionScope(session);
  if (!scope) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { userId } = scope;
  const { roomId } = params;

  const membership = await prisma.studyRoomMember.findUnique({
    where: { roomId_userId: { roomId, userId } },
  });
  if (!membership) return NextResponse.json({ error: "Not a member" }, { status: 403 });

  const activeSession = await prisma.studySession.findFirst({
    where: { roomId, status: { in: ["WAITING", "ACTIVE", "PAUSED"] } },
  });
  if (activeSession) return NextResponse.json({ error: "There is already an active session in this room" }, { status: 409 });

  const body = await req.json().catch(() => ({}));
  const targetDuration = Math.min(Math.max(Number(body.targetDuration) || 25, 5), 120);
  const breakDuration = body.breakDuration != null ? Math.min(Math.max(Number(body.breakDuration), 1), 30) : null;
  const lectureId = body.lectureId || null;
  const lectureTitle = body.lectureTitle || null;

  const newSession = await prisma.studySession.create({
    data: {
      roomId,
      startedById: userId,
      targetDuration,
      breakDuration,
      lectureId,
      lectureTitle,
      status: "WAITING",
      participants: {
        create: { userId, focusSeconds: 0, sessionsCompleted: 0 },
      },
    },
    include: {
      startedBy: { select: { id: true, name: true, image: true } },
      participants: {
        include: {
          user: { select: { id: true, name: true, image: true } },
        },
      },
    },
  });

  return NextResponse.json(newSession, { status: 201 });
}
