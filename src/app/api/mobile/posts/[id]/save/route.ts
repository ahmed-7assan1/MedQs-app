import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getToken } from 'next-auth/jwt';
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const userId = (token?.sub || token?.id) as string | undefined;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

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
}
