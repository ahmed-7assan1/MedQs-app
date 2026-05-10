import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSessionScope } from "@/lib/tenant";

// POST — join a room by invite code
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const scope = await getSessionScope(session);
  if (!scope?.universityId) return NextResponse.json({ error: "No university" }, { status: 403 });

  const { userId } = scope;
  const { code } = await req.json();
  if (!code?.trim()) return NextResponse.json({ error: "Code is required" }, { status: 400 });

  const room = await prisma.studyRoom.findUnique({
    where: { inviteCode: code.trim().toUpperCase() },
    include: { _count: { select: { members: true } } },
  });

  if (!room) return NextResponse.json({ error: "Invalid invite code" }, { status: 404 });
  if (room._count.members >= room.memberLimit) {
    return NextResponse.json({ error: "This room is full" }, { status: 400 });
  }

  const already = await prisma.studyRoomMember.findUnique({
    where: { roomId_userId: { roomId: room.id, userId } },
  });
  if (already) return NextResponse.json({ error: "You are already in this room" }, { status: 400 });

  const member = await prisma.studyRoomMember.create({
    data: { roomId: room.id, userId, role: "MEMBER" },
  });

  return NextResponse.json({ roomId: room.id, member }, { status: 201 });
}
