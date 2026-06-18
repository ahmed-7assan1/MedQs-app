import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerToken } from '@/lib/supabase/auth-helpers';
import { NextRequest } from 'next/server';

export const dynamic = "force-dynamic";

// GET /api/mobile/lectures?semesterId=...&subjectId=...&moduleId=...
export async function GET(req: NextRequest) {
  try {
    const token = await getServerToken(req);
    const userId = (token?.sub || token?.id) as string | undefined;
    const { searchParams } = new URL(req.url);
    const semesterId = searchParams.get('semesterId');
    const subjectId = searchParams.get('subjectId');
    const moduleId = searchParams.get('moduleId');
    const completed = searchParams.get('completed'); // 'true' | 'false'

    const lectures = await prisma.lecture.findMany({
      where: {
        subject: {
          ...(semesterId ? { semesterId } : {}),
          ...(moduleId ? { moduleId } : {}),
          ...(subjectId ? { id: subjectId } : {}),
        },
      },
      orderBy: { order: 'asc' },
      include: {
        subject: {
          select: {
            id: true, name: true,
            module: { select: { id: true, name: true } },
          },
        },
        _count: { select: { videos: true, files: true, flashcards: true } },
        ...(userId ? {
          activities: {
            where: { userId },
            select: { isCompleted: true, lastViewedAt: true },
          },
        } : {}),
      },
    });

    // Flatten activity info
    const result = lectures.map((l: any) => {
      const activity = l.activities?.[0] || null;
      const { activities, ...rest } = l;
      return { ...rest, isCompleted: activity?.isCompleted ?? false, lastViewedAt: activity?.lastViewedAt ?? null };
    });

    // Filter by completed status
    if (completed === 'true') return NextResponse.json(result.filter((l: any) => l.isCompleted));
    if (completed === 'false') return NextResponse.json(result.filter((l: any) => !l.isCompleted));

    return NextResponse.json(result);
  } catch (error) {
    console.error('[MOBILE_LECTURES_GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
