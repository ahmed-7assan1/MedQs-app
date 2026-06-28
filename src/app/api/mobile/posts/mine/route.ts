import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';

export const dynamic = 'force-dynamic';

export const GET = withAuth(async ({ userId, req }) => {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where: { authorId: userId, isForumPost: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          author: { select: { id: true, name: true, image: true } },
          _count: { select: { comments: true, likes: true } },
          forum: { select: { id: true, name: true } },
        },
      }),
      prisma.post.count({ where: { authorId: userId, isForumPost: true } }),
    ]);

    const result = posts.map((p: any) => ({
      ...p,
      isLiked: false,
      reactions: { like: p._count?.likes || 0, love: 0, haha: 0, wow: 0, sad: 0, angry: 0, total: p._count?.likes || 0 },
      commentsCount: p._count?.comments || 0,
    }));

    return NextResponse.json({ posts: result, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    console.error('[MOBILE_POSTS_MINE_GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});
