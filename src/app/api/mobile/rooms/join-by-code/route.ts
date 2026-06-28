import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';

export const POST = withAuth(async ({ req, userId }) => {
  try {
    const { code } = await req.json();
    if (!code) return NextResponse.json({ error: 'Code required' }, { status: 400 });

    const room = await prisma.studyRoom.findUnique({ where: { id: code } });
    if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });

    const existing = await prisma.studyRoomMember.findUnique({
      where: { roomId_userId: { roomId: room.id, userId } },
    });
    if (!existing) {
      await prisma.studyRoomMember.create({ data: { userId, roomId: room.id } });
    }

    const full = await prisma.studyRoom.findUnique({
      where: { id: room.id },
      include: { owner: { select: { id: true, name: true, image: true } }, _count: { select: { members: true, tasks: true } } },
    });

    return NextResponse.json({ ...full, isJoined: true });
  } catch (error) {
    console.error('[MOBILE_ROOMS_JOIN_BY_CODE]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});
