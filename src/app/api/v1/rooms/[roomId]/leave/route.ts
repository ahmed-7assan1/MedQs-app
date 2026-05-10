import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSessionScope } from "@/lib/tenant";

type Params = { params: { roomId: string } };

export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const scope = await getSessionScope(session);
  if (!scope) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { userId } = scope;
  const { roomId } = params;

  const room = await prisma.studyRoom.findUnique({ where: { id: roomId } });
  if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });
  if (room.ownerId === userId) {
    return NextResponse.json({ error: "Owner cannot leave. Delete the room instead." }, { status: 400 });
  }

  await prisma.studyRoomMember.delete({ where: { roomId_userId: { roomId, userId } } });
  return NextResponse.json({ ok: true });
}
