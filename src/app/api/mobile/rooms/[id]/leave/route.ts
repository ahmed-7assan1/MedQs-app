import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';

export const POST = withAuth(async ({ userId, params: rawParams }) => {
  try {
    const { id } = await rawParams;

    await prisma.studyRoomMember.deleteMany({ where: { userId, roomId: id } });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[MOBILE_ROOM_LEAVE]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});
