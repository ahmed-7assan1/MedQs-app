import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';

export const dynamic = 'force-dynamic';

export const GET = withAuth(async ({ userId }) => {
  try {

    const rooms = await prisma.studyRoom.findMany({
      where: { members: { some: { userId } } },
      include: {
        owner: { select: { id: true, name: true, image: true } },
        _count: { select: { members: true, tasks: true } },
      },
    });

    return NextResponse.json(rooms.map((r: any) => ({ ...r, isJoined: true })));
  } catch (error) {
    console.error('[MOBILE_ROOMS_ME_GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});
