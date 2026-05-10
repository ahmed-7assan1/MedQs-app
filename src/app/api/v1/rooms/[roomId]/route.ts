import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSessionScope } from "@/lib/tenant";

type Params = { params: { roomId: string } };

// GET — room details + membership check
export async function GET(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const scope = await getSessionScope(session);
  if (!scope) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { userId } = scope;
  const { roomId } = params;

  const room = await prisma.studyRoom.findUnique({
    where: { id: roomId },
    include: {
      owner: { select: { id: true, name: true, image: true } },
      members: {
        include: {
          user: { select: { id: true, name: true, image: true, points: true, rank: { select: { label: true, badge: true } } } },
        },
        orderBy: { joinedAt: "asc" },
      },
      _count: { select: { members: true, posts: true, tasks: true } },
    },
  });

  if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });

  const myMembership = room.members.find((m) => m.userId === userId);
  const isMember = !!myMembership;
  const isOwner = room.ownerId === userId;

  // Private rooms: only members can see full details
  if (!room.isPublic && !isMember) {
    return NextResponse.json({ error: "This is a private room. You need an invite code to join." }, { status: 403 });
  }

  return NextResponse.json({ ...room, isMember, isOwner, myRole: myMembership?.role ?? null });
}

// PATCH — update room (owner only)
export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const scope = await getSessionScope(session);
  if (!scope) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { userId } = scope;
  const { roomId } = params;

  const room = await prisma.studyRoom.findUnique({ where: { id: roomId } });
  if (!room) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (room.ownerId !== userId) return NextResponse.json({ error: "Only the room owner can edit" }, { status: 403 });

  const { name, description, isPublic, memberLimit } = await req.json();
  const updated = await prisma.studyRoom.update({
    where: { id: roomId },
    data: {
      name: name?.trim() || room.name,
      description: description?.trim() ?? room.description,
      isPublic: isPublic !== undefined ? isPublic : room.isPublic,
      memberLimit: memberLimit ? Math.min(Math.max(Number(memberLimit), 2), 50) : room.memberLimit,
    },
  });

  return NextResponse.json(updated);
}

// DELETE — delete room (owner only)
export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const scope = await getSessionScope(session);
  if (!scope) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { userId } = scope;
  const { roomId } = params;

  const room = await prisma.studyRoom.findUnique({ where: { id: roomId } });
  if (!room) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (room.ownerId !== userId) return NextResponse.json({ error: "Only the owner can delete the room" }, { status: 403 });

  await prisma.studyRoom.delete({ where: { id: roomId } });
  return NextResponse.json({ ok: true });
}
