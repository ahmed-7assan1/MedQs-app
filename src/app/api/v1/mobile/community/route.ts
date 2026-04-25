import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getToken } from 'next-auth/jwt';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET, salt: "authjs.session-token" });
    
    if (!token?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch the latest forum posts for the community feed
    const posts = await db.forumPost.findMany({
      take: 20,
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: {
            name: true,
            image: true,
            role: true
          }
        },
        _count: {
          select: {
            replies: true,
            votes: true
          }
        }
      }
    });

    const formattedPosts = posts.map(post => ({
      id: post.id,
      title: post.title,
      content: post.content,
      category: post.category,
      createdAt: post.createdAt,
      authorName: post.author.name || 'Anonymous User',
      authorImage: post.author.image,
      authorRole: post.author.role,
      likes: post._count.votes,
      comments: post._count.replies,
      isPinned: post.isPinned,
    }));

    // Fetch basic stats for the community header
    const totalUsers = await db.user.count();
    const activeDiscussions = await db.forumPost.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // last 7 days
        }
      }
    });

    return NextResponse.json({
      posts: formattedPosts,
      stats: {
        onlineMembers: Math.floor(totalUsers * 0.1) || 15, // Mocked online for now, web does similar
        totalDiscussions: activeDiscussions
      }
    });
  } catch (error) {
    console.error('Mobile API - Community Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
