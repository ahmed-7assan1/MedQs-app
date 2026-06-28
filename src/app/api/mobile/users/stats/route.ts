import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';

export const dynamic = "force-dynamic";

// GET /api/mobile/users/stats
// Returns: totalAttempts, avgScore, completedLectures, points, rank
export const GET = withAuth(async ({ userId }) => {
  try {

    const [user, attemptStats, completedLectures, recentActivity] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true, name: true, nickname: true, email: true, image: true, points: true, theme: true,
          role: true, bio: true, handle: true, semesterId: true, facultyId: true, universityId: true,
          rank: { select: { id: true, label: true, badge: true, minPoints: true } },
          semester: { select: { id: true, name: true } },
          faculty: { select: { id: true, name: true, category: true } },
          university: { select: { id: true, name: true, logoUrl: true } },
          _count: { select: { quizAttempts: true, followers: true, following: true } },
        },
      }),
      prisma.quizAttempt.aggregate({
        where: { userId },
        _avg: { score: true },
        _count: true,
      }),
      prisma.userLectureActivity.count({ where: { userId, isCompleted: true } }),
      prisma.userLectureActivity.findMany({
        where: { userId },
        orderBy: { lastViewedAt: 'desc' },
        take: 3,
        include: {
          lecture: {
            select: {
              id: true, title: true,
              subject: { select: { id: true, name: true, module: { select: { id: true, name: true } } } },
            },
          },
        },
      }),
    ]);

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Compute study streak: consecutive days with activity
    const activities = await prisma.userLectureActivity.findMany({
      where: { userId },
      orderBy: { lastViewedAt: 'desc' },
      select: { lastViewedAt: true },
    });
    let streak = 0;
    if (activities.length > 0) {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const days = new Set(activities.map((a) => {
        const d = new Date(a.lastViewedAt); d.setHours(0, 0, 0, 0); return d.toISOString();
      }));
      let check = new Date(today);
      while (days.has(check.toISOString())) {
        streak++;
        check.setDate(check.getDate() - 1);
      }
    }

    return NextResponse.json({
      user,
      stats: {
        totalAttempts: attemptStats._count,
        avgScore: Math.round(attemptStats._avg.score ?? 0),
        completedLectures,
        points: user.points,
        rank: user.rank,
        streak,
      },
      recentActivity,
    });
  } catch (error) {
    console.error('[MOBILE_USER_STATS_GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});

// PUT /api/mobile/users/stats  → actually update profile
export const PUT = withAuth(async ({ req, userId }) => {
  try {

    const { name, nickname, bio, image, theme, handle } = await req.json();

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(nickname !== undefined ? { nickname } : {}),
        ...(bio !== undefined ? { bio } : {}),
        ...(image !== undefined ? { image } : {}),
        ...(theme !== undefined ? { theme } : {}),
        ...(handle !== undefined ? { handle } : {}),
      },
      select: { id: true, name: true, nickname: true, email: true, image: true, bio: true, theme: true, handle: true },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('[MOBILE_USER_STATS_PUT]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});
