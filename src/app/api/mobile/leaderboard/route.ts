import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';
import { withOptionalAuth } from '@/lib/auth-middleware';

export const dynamic = "force-dynamic";

// GET /api/mobile/leaderboard?universityId=...&semesterId=...&facultyId=...&limit=50
export const GET = withOptionalAuth(async ({ userId: currentUserId, req }) => {
  try {
    const { searchParams } = new URL(req.url);
    const universityId = searchParams.get('universityId');
    const semesterId = searchParams.get('semesterId');
    const facultyId = searchParams.get('facultyId');
    const limit = parseInt(searchParams.get('limit') || '50');

    const users = await prisma.user.findMany({
      where: {
        points: { gt: 0 },
        hideRank: false,
        ...(universityId ? { universityId } : {}),
        ...(semesterId ? { semesterId } : {}),
        ...(facultyId ? { facultyId } : {}),
      },
      orderBy: { points: 'desc' },
      take: limit,
      select: {
        id: true, name: true, nickname: true, image: true, handle: true, points: true,
        rank: { select: { id: true, label: true, badge: true } },
        faculty: { select: { id: true, name: true } },
        semester: { select: { id: true, name: true } },
      },
    });

    const withPosition = users.map((u: any, i: number) => ({ ...u, position: i + 1 }));

    // Find current user's position if logged in
    let currentUserEntry = null;
    if (currentUserId) {
      const idx = withPosition.findIndex((u: any) => u.id === currentUserId);
      if (idx === -1) {
        // User is outside top N — find their real rank
        const betterCount = await prisma.user.count({
          where: {
            points: { gt: 0 }, hideRank: false,
            ...(universityId ? { universityId } : {}),
            ...(semesterId ? { semesterId } : {}),
            ...(facultyId ? { facultyId } : {}),
            // users with more points than current user
          },
        });
        const me = await prisma.user.findUnique({
          where: { id: currentUserId },
          select: { id: true, name: true, nickname: true, image: true, handle: true, points: true, rank: { select: { id: true, label: true, badge: true } } },
        });
        if (me) currentUserEntry = { ...me, position: betterCount + 1 };
      } else {
        currentUserEntry = withPosition[idx];
      }
    }

    return NextResponse.json({ leaderboard: withPosition, currentUser: currentUserEntry });
  } catch (error) {
    console.error('[MOBILE_LEADERBOARD_GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});
