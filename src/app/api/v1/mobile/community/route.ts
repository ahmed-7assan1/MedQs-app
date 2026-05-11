import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getToken } from 'next-auth/jwt';
import { NextRequest } from 'next/server';

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET, salt: "authjs.session-token" });
    
    if (!token?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch the latest forum posts for the community feed
    const posts = await prisma.post.findMany({
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
            comments: true,
            likes: true
          }
        }
      }
    });

    const formattedPosts = posts.map((post: any) => ({
      id: post.id,
      title: post.content.substring(0, 40) + "...",
      content: post.content,
      createdAt: post.createdAt,
      authorName: post.author.name || 'Anonymous User',
      authorImage: post.author.image,
      authorRole: post.author.role,
      likes: post._count.likes,
      comments: post._count.comments,
      isPinned: post.isPinned,
    }));

    // Fetch basic stats for the community header
    const totalUsers = await prisma.user.count();
    const activeDiscussions = await prisma.post.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // last 7 days
        }
      }
    });

    return NextResponse.json({
      posts: formattedPosts,
      stats: {
        onlineMembers: Math.floor(totalUsers * 0.1) || 15,
        totalDiscussions: activeDiscussions
      }
    });
  } catch (error) {
    console.error('Mobile API - Community Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
