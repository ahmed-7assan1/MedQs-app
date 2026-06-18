import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerToken } from '@/lib/supabase/auth-helpers';
import { NextRequest } from 'next/server';

// POST /api/mobile/users/[userId]/follow  — toggle follow
export async function POST(req: NextRequest, props: { params: Promise<{ userId: string }> }) {
  const params = await props.params;
  try {
    const token = await getServerToken(req);
    const currentUserId = (token?.sub || token?.id) as string | undefined;
    if (!currentUserId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (currentUserId === params.userId) {
      return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 });
    }

    const existing = await prisma.userFollow.findUnique({
      where: { followerId_followingId: { followerId: currentUserId, followingId: params.userId } },
    });

    if (existing) {
      await prisma.userFollow.delete({ where: { id: existing.id } });
      return NextResponse.json({ following: false });
    } else {
      await prisma.userFollow.create({ data: { followerId: currentUserId, followingId: params.userId } });
      return NextResponse.json({ following: true });
    }
  } catch (error) {
    console.error('[MOBILE_USERS_FOLLOW_POST]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
