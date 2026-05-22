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

  const existing = await prisma.studySession.findUnique({
    where: { id: sessionId },
    include: { participants: true },
  });
  if (!existing || existing.roomId !== roomId) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (existing.startedById !== userId) return NextResponse.json({ error: "Only the host can kick" }, { status: 403 });

  const { targetUserId } = await req.json();
  if (!targetUserId) return NextResponse.json({ error: "targetUserId required" }, { status: 400 });
  if (targetUserId === userId) return NextResponse.json({ error: "Cannot kick yourself" }, { status: 400 });

  const participant = existing.participants.find((p) => p.userId === targetUserId);
  if (!participant) return NextResponse.json({ error: "User not in session" }, { status: 404 });

  await prisma.studySessionParticipant.delete({
    where: { sessionId_userId: { sessionId, userId: targetUserId } },
  });

  return NextResponse.json({ ok: true });
}
