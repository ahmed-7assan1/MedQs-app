import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';
import { withAuth, withOptionalAuth } from '@/lib/auth-middleware';

export const dynamic = 'force-dynamic';

export const GET = withOptionalAuth(async ({ userId, req }) => {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');

    const rooms = await prisma.studyRoom.findMany({
      where: { ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}) },
      orderBy: { createdAt: 'desc' },
      include: {
        owner: { select: { id: true, name: true, image: true } },
        ...(userId ? { members: { where: { userId }, select: { id: true } } } : {}),
        _count: { select: { members: true, tasks: true } },
      },
    });

    const result = rooms.map((r: any) => {
      const isJoined = r.members?.length > 0;
      const { members, ...rest } = r;
      return { ...rest, isJoined };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('[MOBILE_ROOMS_GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});

export const POST = withAuth(async ({ req, userId }) => {
  try {
    const body = await req.json();
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { universityId: true } });
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const room = await prisma.studyRoom.create({
      data: { name: body.name, description: body.description || '', ownerId: userId, inviteCode, universityId: user?.universityId ?? '' },
      include: { owner: { select: { id: true, name: true, image: true } } },
    });

    return NextResponse.json({ ...room, isJoined: true, _count: { members: 1, tasks: 0 } }, { status: 201 });
  } catch (error) {
    console.error('[MOBILE_ROOMS_POST]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});
