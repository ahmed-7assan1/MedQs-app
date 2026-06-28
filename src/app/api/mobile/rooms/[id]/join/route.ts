import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerToken } from '@/lib/supabase/auth-helpers';
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const token = await getServerToken(req);
    const userId = (token?.sub || token?.id) as string | undefined;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await props.params;

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
}
