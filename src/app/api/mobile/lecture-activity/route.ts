import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';

// POST /api/mobile/lecture-activity
// Body: { lectureId, isCompleted, source? }
// Called every 10s during playback AND on video completion
export const POST = withAuth(async ({ req, userId }) => {
  try {

    const { lectureId, isCompleted, source } = await req.json();
    if (!lectureId) return NextResponse.json({ error: 'lectureId required' }, { status: 400 });

    const activity = await prisma.userLectureActivity.upsert({
      where: { userId_lectureId: { userId, lectureId } },
      update: {
        lastViewedAt: new Date(),
        ...(isCompleted ? { isCompleted: true } : {}),
        ...(source ? { source } : {}),
      },
      create: {
        userId,
        lectureId,
        isCompleted: isCompleted ?? false,
        source: source ?? 'video',
        lastViewedAt: new Date(),
      },
    });

    // Award points on first completion
    if (isCompleted) {
      const existingLogs = await prisma.engagementLog.count({
        where: { userId, action: `LECTURE_COMPLETE_${lectureId}` },
      });
      if (existingLogs === 0) {
        await prisma.user.update({ where: { id: userId }, data: { points: { increment: 5 } } });
        await prisma.engagementLog.create({
          data: { userId, action: `LECTURE_COMPLETE_${lectureId}`, points: 5 },
        });
      }
    }

    return NextResponse.json(activity);
  } catch (error) {
    console.error('[MOBILE_LECTURE_ACTIVITY_POST]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});
