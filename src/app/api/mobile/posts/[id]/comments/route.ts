import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getToken } from 'next-auth/jwt';
import { NextRequest } from 'next/server';

// GET /api/mobile/posts/[id]/comments
export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const comments = await prisma.comment.findMany({
      where: { postId: params.id, parentId: null },
      orderBy: { createdAt: 'asc' },
      include: {
        author: { select: { id: true, name: true, image: true, handle: true } },
        replies: {
          include: { author: { select: { id: true, name: true, image: true, handle: true } } },
          orderBy: { createdAt: 'asc' },
        },
        _count: { select: { likes: true, replies: true } },
      },
    });
    return NextResponse.json(comments);
  } catch (error) {
    console.error('[MOBILE_POST_COMMENTS_GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/mobile/posts/[id]/comments
export async function POST(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const userId = (token?.sub || token?.id) as string | undefined;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { content, parentId } = await req.json();
    if (!content) return NextResponse.json({ error: 'content required' }, { status: 400 });

    const post = await prisma.post.findUnique({ where: { id: params.id }, select: { universityId: true } });
    if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 });

    const comment = await prisma.comment.create({
      data: {
        content,
        postId: params.id,
        authorId: userId,
        universityId: post.universityId,
        parentId: parentId ?? null,
      },
      include: { author: { select: { id: true, name: true, image: true, handle: true } } },
    });

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error('[MOBILE_POST_COMMENTS_POST]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
