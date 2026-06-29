import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';
import { withOptionalAuth } from '@/lib/auth-middleware';

export const GET = withOptionalAuth(async ({ userId, params: rawParams }) => {
  const params = await rawParams;
  try {

    const post = await prisma.post.findUnique({
      where: { id: params.id },
      include: {
        author: { select: { id: true, name: true, image: true, handle: true, rank: { select: { badge: true, label: true } } } },
        forum: { select: { id: true, name: true } },
        _count: { select: { comments: true, likes: true } },
        ...(userId ? {
          likes: { where: { userId }, select: { id: true } },
          savedBy: { where: { userId }, select: { id: true } },
        } : {}),
      },
    });

    if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const { likes, savedBy, _count, ...rest } = post as any;
    const result = {
      ...rest,
      isLiked: likes?.length > 0,
      isSaved: savedBy?.length > 0,
      reactions: { like: _count?.likes || 0, love: 0, haha: 0, wow: 0, sad: 0, angry: 0, total: _count?.likes || 0 },
      commentsCount: _count?.comments || 0,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('[MOBILE_POST_GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});
