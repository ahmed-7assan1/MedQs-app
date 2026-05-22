import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSessionScope } from "@/lib/tenant";
export const dynamic = "force-dynamic";

type Params = { params: { roomId: string; sessionId: string } };

export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const scope = await getSessionScope(session);
  if (!scope) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { userId } = scope;
  const { roomId, sessionId } = params;

  const membership = await prisma.studyRoomMember.findUnique({
    where: { roomId_userId: { roomId, userId } },
  });
  if (!membership) return NextResponse.json({ error: "Not a member" }, { status: 403 });

  const existingSession = await prisma.studySession.findUnique({ where: { id: sessionId } });
  if (!existingSession || existingSession.roomId !== roomId) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (existingSession.status !== "WAITING") return NextResponse.json({ error: "Session already started" }, { status: 409 });

  const alreadyJoined = await prisma.studySessionParticipant.findUnique({
    where: { sessionId_userId: { sessionId, userId } },
  });
  if (alreadyJoined) return NextResponse.json({ error: "Already joined" }, { status: 409 });

  const participant = await prisma.studySessionParticipant.create({
    data: { sessionId, userId },
    include: { user: { select: { id: true, name: true, image: true } } },
  });

  return NextResponse.json(participant, { status: 201 });
}
