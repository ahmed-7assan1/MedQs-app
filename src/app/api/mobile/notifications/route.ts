import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerToken } from '@/lib/supabase/auth-helpers';
import { NextRequest } from 'next/server';
import { z } from 'zod';

const MuteSchema = z.object({
  muteAll: z.boolean().optional(),
  muteForum: z.boolean().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const token = await getServerToken(req);
    const userId = (token?.sub || token?.id) as string | undefined;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const read = searchParams.get('read');
    const limit = parseInt(searchParams.get('limit') || '30');

    const [notifications, unreadCount, mute] = await Promise.all([
      prisma.notification.findMany({
        where: {
          userId,
          ...(read === 'false' ? { read: false } : read === 'true' ? { read: true } : {}),
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      prisma.notification.count({ where: { userId, read: false } }),
      prisma.notificationMute.findUnique({ where: { userId } }),
    ]);

    return NextResponse.json({ notifications, unreadCount, mute });
  } catch (error) {
    console.error('[MOBILE_NOTIFICATIONS_GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const token = await getServerToken(req);
    const userId = (token?.sub || token?.id) as string | undefined;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const parsed = MuteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0]?.message }, { status: 400 });
    }

    const mute = await prisma.notificationMute.upsert({
      where: { userId },
      create: { userId, ...parsed.data },
      update: parsed.data,
    });

    return NextResponse.json({ mute });
  } catch (error) {
    console.error('[MOBILE_NOTIFICATIONS_PUT]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/mobile/notifications  — mark notifications as read
export async function POST(req: NextRequest) {
  try {
    const token = await getServerToken(req);
    const userId = (token?.sub || token?.id) as string | undefined;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { ids } = await req.json();

    if (ids && ids.length > 0) {
      await prisma.notification.updateMany({ where: { id: { in: ids }, userId }, data: { read: true } });
    } else {
      await prisma.notification.updateMany({ where: { userId }, data: { read: true } });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[MOBILE_NOTIFICATIONS_POST]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
