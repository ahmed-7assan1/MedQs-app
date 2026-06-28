import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';

export const POST = withAuth(async ({ userId, params: rawParams }) => {
  try {
    const { id } = await rawParams;

    const room = await prisma.studyRoom.findUnique({ where: { id } });
    if (!room) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    await prisma.studyRoomMember.upsert({
      where: { roomId_userId: { roomId: id, userId } },
      create: { userId, roomId: id },
      update: {},
    });

    return NextResponse.json({ ok: true, isJoined: true });
  } catch (error) {
    console.error('[MOBILE_ROOM_JOIN]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});
