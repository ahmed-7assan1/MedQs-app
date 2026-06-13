import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getToken } from 'next-auth/jwt';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await props.params;
    const tasks = await prisma.studyRoomTask.findMany({
      where: { roomId: id },
      orderBy: { createdAt: 'desc' },
      include: { assignedTo: { select: { id: true, name: true, image: true } } },
    });
    return NextResponse.json(tasks);
  } catch (error) {
    console.error('[MOBILE_ROOM_TASKS_GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const userId = (token?.sub || token?.id) as string | undefined;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await props.params;
    const body = await req.json();

    const task = await prisma.studyRoomTask.create({
      data: { title: body.title, roomId: id, createdById: userId, assignedToId: body.assignedToId || null },
      include: { assignedTo: { select: { id: true, name: true, image: true } } },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error('[MOBILE_ROOM_TASKS_POST]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
