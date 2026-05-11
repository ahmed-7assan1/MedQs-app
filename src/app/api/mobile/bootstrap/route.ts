import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getToken } from 'next-auth/jwt';
import { NextRequest } from 'next/server';
import { redis } from '@/lib/redis';

export const dynamic = "force-dynamic";

// GET /api/mobile/bootstrap — everything the app needs at startup in ONE call
export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const userId = (token?.sub || token?.id) as string | undefined;
    
    // 1. Get Site Config (can be public or scoped to user's uni)
    const universityId = req.nextUrl.searchParams.get('universityId');
    const config = await prisma.siteConfig.findFirst();

    if (!userId) {
      // Unauthenticated bootstrap (only config)
      return NextResponse.json({ config, user: null, home: null });
    }

    // 2. Get User & Home Data (Authenticated)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, name: true, nickname: true, email: true, image: true,
        role: true, points: true, semesterId: true, facultyId: true, universityId: true,
        rank: { select: { id: true, label: true, badge: true } },
        university: { select: { id: true, name: true } },
        semester: { select: { id: true, name: true } },
        faculty: { select: { id: true, name: true, category: true } },
      },
    });

    if (!user) {
      return NextResponse.json({ config, user: null, home: null });
    }

    // 3. Get Home Data (Dashboard)
    // ─── Caching Strategy (Ads & Leaderboard) ───
    const adsKey = `mobile:ads:${user.universityId || 'default'}`;
    const topUsersKey = `mobile:topusers:${user.universityId || 'default'}`;

    let adBanners: any[] = [];
    let topUsers: any[] = [];

    try {
      const [cachedAds, cachedTop] = await Promise.all([
        redis.get(adsKey),
        redis.get(topUsersKey),
      ]);
      if (cachedAds) adBanners = JSON.parse(cachedAds);
      if (cachedTop) topUsers = JSON.parse(cachedTop);
    } catch (e) {}

    const [
      attemptStats,
      completedLectures,
      recentActivity,
      suggestedPapers,
      todayTasks,
      unreadNotifs,
      dbAdBanners,
      dbTopUsers,
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
      adBanners.length === 0 && user.universityId ? prisma.adBanner.findMany({
        where: { universityId: user.universityId, active: true },
        take: 5,
        select: { id: true, imageUrl: true, linkUrl: true },
      }) : Promise.resolve(null),
      topUsers.length === 0 && user.universityId ? prisma.user.findMany({
        where: { universityId: user.universityId, points: { gt: 0 }, hideRank: false },
        orderBy: { points: 'desc' },
        take: 3,
        select: { id: true, name: true, image: true, points: true, rank: { select: { badge: true, label: true } } },
      }) : Promise.resolve(null),
    ]);

    if (dbAdBanners) {
      adBanners = dbAdBanners;
      redis.setex(adsKey, 24 * 60 * 60, JSON.stringify(adBanners)).catch(() => {});
    }
    if (dbTopUsers) {
      topUsers = dbTopUsers;
      redis.setex(topUsersKey, 5 * 60 * 60, JSON.stringify(topUsers)).catch(() => {});
    }

    const home = {
      stats: { 
        totalAttempts: attemptStats._count, 
        avgScore: Math.round(attemptStats._avg.score ?? 0), 
        completedLectures, 
        points: user.points, 
        rank: user.rank 
      },
      recentActivity,
      suggestedPapers,
      todayTasks,
      unreadNotifs,
      adBanners,
      topUsers,
    };

    return NextResponse.json({ config, user, home });
  } catch (error) {
    console.error('[MOBILE_BOOTSTRAP_GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
