import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';

// POST /api/mobile/posts/[id]/like  — toggle like
export const POST = withAuth(async ({ userId, params: rawParams }) => {
  const params = await rawParams;
  try {
    const existing = await prisma.like.findUnique({ where: { userId_postId: { userId, postId: params.id } } });

    if (existing) {
      await prisma.like.delete({ where: { userId_postId: { userId, postId: params.id } } });
      const count = await prisma.like.count({ where: { postId: params.id } });
      return NextResponse.json({ liked: false, likesCount: count });
    } else {
      await prisma.like.create({ data: { userId, postId: params.id } });
      const count = await prisma.like.count({ where: { postId: params.id } });
      return NextResponse.json({ liked: true, likesCount: count });
    }
  } catch (error) {
    console.error('[MOBILE_POST_LIKE_POST]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});
