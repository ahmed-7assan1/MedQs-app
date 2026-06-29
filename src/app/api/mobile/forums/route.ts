import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';
import { withOptionalAuth } from '@/lib/auth-middleware';

export const dynamic = "force-dynamic";

// GET /api/mobile/forums?universityId=...&type=GLOBAL|SEMESTER&semesterId=...
export const GET = withOptionalAuth(async ({ userId, req }) => {
  try {
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
});
