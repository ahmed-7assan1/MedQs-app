import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getToken } from 'next-auth/jwt';
import { NextRequest } from 'next/server';

// GET /api/mobile/notifications?read=false&limit=10
export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const userId = (token?.sub || token?.id) as string | undefined;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const read = searchParams.get('read');
    const limit = parseInt(searchParams.get('limit') || '30');

    const notifications = await prisma.notification.findMany({
      where: {
        userId,
        ...(read === 'false' ? { read: false } : read === 'true' ? { read: true } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    const unreadCount = await prisma.notification.count({ where: { userId, read: false } });

    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    console.error('[MOBILE_NOTIFICATIONS_GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/mobile/notifications/mark-read
export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const userId = (token?.sub || token?.id) as string | undefined;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { ids } = await req.json();

    if (ids && ids.length > 0) {
      await prisma.notification.updateMany({ where: { id: { in: ids }, userId }, data: { read: true } });
    } else {
      // Mark all as read
      await prisma.notification.updateMany({ where: { userId }, data: { read: true } });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[MOBILE_NOTIFICATIONS_POST]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
