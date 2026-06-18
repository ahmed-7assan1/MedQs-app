import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerToken } from '@/lib/supabase/auth-helpers';
import { NextRequest } from 'next/server';

// POST /api/mobile/posts/[id]/like  — toggle like
export async function POST(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const token = await getServerToken(req);
    const userId = (token?.sub || token?.id) as string | undefined;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

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
}
