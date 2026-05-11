import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getToken } from 'next-auth/jwt';
import { NextRequest } from 'next/server';

export const dynamic = "force-dynamic";

// GET /api/mobile/forums?universityId=...&type=GLOBAL|SEMESTER&semesterId=...
export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const userId = (token?.sub || token?.id) as string | undefined;
    const { searchParams } = new URL(req.url);
    const universityId = searchParams.get('universityId');
    const type = searchParams.get('type') as any;
    const semesterId = searchParams.get('semesterId');

    const forums = await prisma.forum.findMany({
      where: {
        ...(universityId ? { universityId } : {}),
        ...(type ? { type } : {}),
        ...(semesterId ? { semesterId } : {}),
        status: { not: 'CLOSED' },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { posts: true, members: true } },
        semester: { select: { id: true, name: true } },
        ...(userId ? {
          members: { where: { userId }, select: { id: true } },
        } : {}),
      },
    });

    const result = forums.map((f: any) => {
      const isMember = f.members?.length > 0;
      const { members, ...rest } = f;
      return { ...rest, isMember };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('[MOBILE_FORUMS_GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
