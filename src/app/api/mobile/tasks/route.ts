import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getToken } from 'next-auth/jwt';
import { NextRequest } from 'next/server';

// GET /api/mobile/tasks?date=2026-04-25
export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const userId = (token?.sub || token?.id) as string | undefined;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get('date');
    const date = dateStr ? new Date(dateStr) : new Date();
    const start = new Date(date); start.setHours(0, 0, 0, 0);
    const end = new Date(date); end.setHours(23, 59, 59, 999);

    const tasks = await prisma.userTask.findMany({
      where: { userId, date: { gte: start, lte: end } },
      orderBy: { time: 'asc' },
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error('[MOBILE_TASKS_GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/mobile/tasks — create task
export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const userId = (token?.sub || token?.id) as string | undefined;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { title, description, time, date, lectureId } = await req.json();
    if (!title) return NextResponse.json({ error: 'title required' }, { status: 400 });

    const task = await prisma.userTask.create({
      data: { title, description, time, date: date ? new Date(date) : new Date(), lectureId, userId },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error('[MOBILE_TASKS_POST]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/mobile/tasks — toggle complete
export async function PATCH(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const userId = (token?.sub || token?.id) as string | undefined;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id, completed } = await req.json();
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const task = await prisma.userTask.update({
      where: { id, userId },
      data: { completed },
    });

    return NextResponse.json(task);
  } catch (error) {
    console.error('[MOBILE_TASKS_PATCH]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
