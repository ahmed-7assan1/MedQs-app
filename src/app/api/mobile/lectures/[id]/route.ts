import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerToken } from '@/lib/supabase/auth-helpers';
import { NextRequest } from 'next/server';

// GET /api/mobile/lectures/[id]
export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const token = await getServerToken(req);
    const userId = (token?.sub || token?.id) as string | undefined;

    const lecture = await prisma.lecture.findUnique({
      where: { id: params.id },
      include: {
        subject: {
          select: {
            id: true, name: true,
            module: { select: { id: true, name: true } },
          },
        },
        videos: {
          orderBy: { sortOrder: 'asc' },
          select: {
            id: true, title: true, url: true, sourceType: true,
            sharingEnabled: true, likesCount: true, commentsCount: true, sortOrder: true,
          },
        },
        files: { select: { id: true, name: true, url: true, mimeType: true } },
        flashcards: { select: { id: true, front: true, back: true } },
        records: {
          orderBy: { createdAt: 'asc' },
          select: { id: true, title: true, url: true, sourceType: true },
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

    if (!lecture) {
      return NextResponse.json({ error: 'Lecture not found' }, { status: 404 });
    }

    const activity = (lecture as any).activities?.[0] || null;
    const { activities, ...rest } = lecture as any;

    return NextResponse.json({
      ...rest,
      isCompleted: activity?.isCompleted ?? false,
      lastViewedAt: activity?.lastViewedAt ?? null,
    });
  } catch (error) {
    console.error('[MOBILE_LECTURE_DETAIL_GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
