import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSessionScope } from "@/lib/tenant";
export const dynamic = "force-dynamic";

type Params = { params: { roomId: string; sessionId: string } };

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const scope = await getSessionScope(session);
  if (!scope) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { userId } = scope;
  const { roomId, sessionId } = params;

  const existingSession = await prisma.studySession.findUnique({ where: { id: sessionId } });
  if (!existingSession || existingSession.roomId !== roomId) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (existingSession.status !== "ACTIVE") return NextResponse.json({ error: "Session not active" }, { status: 409 });

  const participant = await prisma.studySessionParticipant.findUnique({
    where: { sessionId_userId: { sessionId, userId } },
  });
  if (!participant) return NextResponse.json({ error: "Not in session" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const { focusSeconds, sessionsCompleted } = body;

  const updated = await prisma.studySessionParticipant.update({
    where: { sessionId_userId: { sessionId, userId } },
    data: {
      ...(focusSeconds != null ? { focusSeconds } : {}),
      ...(sessionsCompleted != null ? { sessionsCompleted } : {}),
      lastFocusAt: new Date(),
    },
  });

  return NextResponse.json(updated);
}
