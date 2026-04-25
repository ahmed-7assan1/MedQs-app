import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getToken } from 'next-auth/jwt';
import { NextRequest } from 'next/server';

// GET /api/mobile/home — full dashboard data in one call
export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const userId = (token?.sub || token?.id) as string | undefined;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, name: true, nickname: true, email: true, image: true,
        points: true, semesterId: true, facultyId: true, universityId: true,
        rank: { select: { id: true, label: true, badge: true } },
        university: { select: { id: true, name: true } },
        semester: { select: { id: true, name: true } },
      },
    });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const [
      attemptStats,
      completedLectures,
      recentActivity,
      suggestedPapers,
      todayTasks,
      unreadNotifs,
      adBanners,
      topUsers,
    ] = await Promise.all([
      prisma.quizAttempt.aggregate({ where: { userId }, _avg: { score: true }, _count: true }),
      prisma.userLectureActivity.count({ where: { userId, isCompleted: true } }),
      prisma.userLectureActivity.findMany({
        where: { userId },
        orderBy: { lastViewedAt: 'desc' },
        take: 5,
        include: {
          lecture: {
            select: {
              id: true, title: true,
              subject: { select: { id: true, name: true, module: { select: { id: true, name: true } } } },
            },
          },
        },
      }),
      user.semesterId ? prisma.pastPaper.findMany({
        where: { semesterId: user.semesterId, isPrivate: false },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { module: { select: { id: true, name: true } }, _count: { select: { attempts: true } } },
      }) : Promise.resolve([]),
      prisma.userTask.findMany({
        where: { userId, date: { gte: new Date(new Date().setHours(0,0,0,0)), lte: new Date(new Date().setHours(23,59,59,999)) } },
        orderBy: { time: 'asc' },
      }),
      prisma.notification.count({ where: { userId, read: false } }),
      user.universityId ? prisma.adBanner.findMany({
        where: { universityId: user.universityId, active: true },
        take: 5,
        select: { id: true, imageUrl: true, linkUrl: true },
      }) : Promise.resolve([]),
      user.universityId ? prisma.user.findMany({
        where: { universityId: user.universityId, points: { gt: 0 }, hideRank: false },
        orderBy: { points: 'desc' },
        take: 3,
        select: { id: true, name: true, image: true, points: true, rank: { select: { badge: true, label: true } } },
      }) : Promise.resolve([]),
    ]);

    // Compute streak
    const allActivity = await prisma.userLectureActivity.findMany({
      where: { userId }, orderBy: { lastViewedAt: 'desc' }, select: { lastViewedAt: true },
    });
    let streak = 0;
    if (allActivity.length > 0) {
      const today = new Date(); today.setHours(0,0,0,0);
      const days = new Set(allActivity.map((a: { lastViewedAt: Date }) => { const d = new Date(a.lastViewedAt); d.setHours(0,0,0,0); return d.toISOString(); }));
      let check = new Date(today);
      while (days.has(check.toISOString())) { streak++; check.setDate(check.getDate() - 1); }
    }

    return NextResponse.json({
      user,
      stats: { totalAttempts: attemptStats._count, avgScore: Math.round(attemptStats._avg.score ?? 0), completedLectures, points: user.points, rank: user.rank, streak },
      recentActivity,
      suggestedPapers,
      todayTasks,
      unreadNotifs,
      adBanners,
      topUsers,
    });
  } catch (error) {
    console.error('[MOBILE_HOME_GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
