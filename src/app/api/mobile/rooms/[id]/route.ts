import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerToken } from '@/lib/supabase/auth-helpers';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const token = await getServerToken(req);
    const userId = (token?.sub || token?.id) as string | undefined;
    const { id } = await props.params;

    const room = await prisma.studyRoom.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, name: true, image: true } },
        members: { include: { user: { select: { id: true, name: true, image: true } } } },
        _count: { select: { members: true, tasks: true } },
      },
    });

    if (!room) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const isJoined = userId ? room.members.some((m) => m.userId === userId) : false;
    const { members, ...rest } = room;

    return NextResponse.json({ ...rest, members: members.map((m) => m.user), isJoined });
  } catch (error) {
    console.error('[MOBILE_ROOM_GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
