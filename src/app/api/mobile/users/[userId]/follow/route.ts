import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';

// POST /api/mobile/users/[userId]/follow  — toggle follow
export const POST = withAuth(async ({ userId: currentUserId, params: rawParams }) => {
  const params = await rawParams;
  try {

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
});
