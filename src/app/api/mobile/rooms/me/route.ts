import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerToken } from '@/lib/supabase/auth-helpers';
import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const token = await getServerToken(req);
    const userId = (token?.sub || token?.id) as string;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

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
}
