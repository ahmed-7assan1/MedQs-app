import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';

export const GET = withAuth(async ({ req, userId: currentUserId, params: rawParams }) => {
  try {
    const params = await rawParams;
    const targetId = params.userId;

    if (targetId === 'me') {
      return NextResponse.redirect(new URL('/api/mobile/profile', req.url));
    }

    const user = await prisma.user.findUnique({
      where: { id: targetId },
      select: {
        id: true, name: true, nickname: true, email: true, image: true,
        bio: true, handle: true, coverImage: true, points: true,
        role: true, isPrivate: true,
        rank: { select: { label: true, badge: true } },
        university: { select: { id: true, name: true } },
        faculty: { select: { id: true, name: true } },
        semester: { select: { id: true, name: true } },
        _count: { select: { posts: true, followers: true, following: true } },
      },
    });

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const isFollowing = await prisma.userFollow.findUnique({
      where: { followerId_followingId: { followerId: currentUserId, followingId: targetId } },
      select: { id: true },
    });

    const posts = await prisma.post.findMany({
      where: { authorId: targetId, isForumPost: true },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        author: { select: { id: true, name: true, image: true } },
        _count: { select: { comments: true, likes: true } },
      },
    });

    const mappedPosts = posts.map((p: any) => ({
      ...p,
      isLiked: false,
      reactions: { like: p._count?.likes || 0, love: 0, haha: 0, wow: 0, sad: 0, angry: 0, total: p._count?.likes || 0 },
      commentsCount: p._count?.comments || 0,
    }));

    return NextResponse.json({ user, posts: mappedPosts, isFollowing: !!isFollowing });
  } catch (error) {
    console.error('[MOBILE_USERS_GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});
