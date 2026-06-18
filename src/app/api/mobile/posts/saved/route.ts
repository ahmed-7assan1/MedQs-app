import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerToken } from '@/lib/supabase/auth-helpers';
import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const token = await getServerToken(req);
    const userId = (token?.sub || token?.id) as string | undefined;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      prisma.savedPost.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          post: {
            include: {
              author: { select: { id: true, name: true, image: true } },
              _count: { select: { comments: true, likes: true } },
              forum: { select: { id: true, name: true } },
            },
          },
        },
      }),
      prisma.savedPost.count({ where: { userId } }),
    ]);

    const mapped = posts.map((sp: any) => ({
      ...sp.post,
      isSaved: true,
      isLiked: false,
      reactions: { like: sp.post._count?.likes || 0, love: 0, haha: 0, wow: 0, sad: 0, angry: 0, total: sp.post._count?.likes || 0 },
      commentsCount: sp.post._count?.comments || 0,
    }));

    return NextResponse.json({ posts: mapped, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    console.error('[MOBILE_POSTS_SAVED_GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
