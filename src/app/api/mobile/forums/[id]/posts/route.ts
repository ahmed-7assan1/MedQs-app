import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';
import { withAuth, withOptionalAuth } from '@/lib/auth-middleware';

// GET /api/mobile/forums/[id]/posts?page=1&limit=20
export const GET = withOptionalAuth(async ({ userId, params: rawParams, req }) => {
  const params = await rawParams;
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const forum = await prisma.forum.findUnique({ where: { id: params.id }, select: { id: true, name: true, type: true, status: true } });
    if (!forum) return NextResponse.json({ error: 'Forum not found' }, { status: 404 });

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where: { forumId: params.id, isForumPost: true },
        orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
        include: {
          author: { select: { id: true, name: true, image: true, handle: true, rank: { select: { badge: true, label: true } } } },
          _count: { select: { comments: true, likes: true } },
          ...(userId ? {
            likes: { where: { userId }, select: { id: true } },
          } : {}),
        },
      }),
      prisma.post.count({ where: { forumId: params.id, isForumPost: true } }),
    ]);

    const result = posts.map((p: any) => {
      const isLiked = p.likes?.length > 0;
      const { likes, ...rest } = p;
      return { ...rest, isLiked };
    });

    return NextResponse.json({ forum, posts: result, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    console.error('[MOBILE_FORUM_POSTS_GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});

export const POST = withAuth(async ({ req, userId, params: rawParams }) => {
  const params = await rawParams;
  try {
    const { content, imageUrl } = await req.json();
    if (!content) return NextResponse.json({ error: 'content required' }, { status: 400 });

    const forum = await prisma.forum.findUnique({ where: { id: params.id }, select: { universityId: true, status: true } });
    if (!forum) return NextResponse.json({ error: 'Forum not found' }, { status: 404 });
    if (forum.status === 'READ_ONLY') return NextResponse.json({ error: 'Forum is read-only' }, { status: 403 });

    const post = await prisma.post.create({
      data: {
        content,
        imageUrl: imageUrl ?? null,
        forumId: params.id,
        authorId: userId,
        universityId: forum.universityId,
        audience: 'UNIVERSITY',
      },
      include: {
        author: { select: { id: true, name: true, image: true, handle: true, rank: { select: { badge: true, label: true } } } },
        _count: { select: { comments: true, likes: true } },
      },
    });

    return NextResponse.json({ ...post, isLiked: false }, { status: 201 });
  } catch (error) {
    console.error('[MOBILE_FORUM_POSTS_POST]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});
