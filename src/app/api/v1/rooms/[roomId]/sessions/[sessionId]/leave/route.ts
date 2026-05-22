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

  const existingSession = await prisma.studySession.findUnique({ where: { id: sessionId } });
  if (!existingSession || existingSession.roomId !== roomId) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (existingSession.startedById === userId) {
    return NextResponse.json({ error: "Host cannot leave. Cancel or end the session instead." }, { status: 400 });
  }

  const participant = await prisma.studySessionParticipant.findUnique({
    where: { sessionId_userId: { sessionId, userId } },
  });
  if (!participant) return NextResponse.json({ error: "Not in session" }, { status: 404 });

  await prisma.studySessionParticipant.delete({
    where: { sessionId_userId: { sessionId, userId } },
  });

  return NextResponse.json({ ok: true });
}
