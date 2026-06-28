import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';

export const POST = withAuth(async ({ userId, params: rawParams }) => {
  const params = await rawParams;
  try {
    const existing = await prisma.savedPost.findUnique({ where: { userId_postId: { userId, postId: params.id } } });

    if (existing) {
      await prisma.savedPost.delete({ where: { userId_postId: { userId, postId: params.id } } });
      return NextResponse.json({ saved: false });
    } else {
      await prisma.savedPost.create({ data: { userId, postId: params.id } });
      return NextResponse.json({ saved: true });
    }
  } catch (error) {
    console.error('[MOBILE_POST_SAVE_POST]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});
