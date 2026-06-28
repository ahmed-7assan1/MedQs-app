import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';

export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await props.params;
    const tasks = await prisma.studyRoomTask.findMany({
      where: { roomId: id },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(tasks);
  } catch (error) {
    console.error('[MOBILE_ROOM_TASKS_GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const POST = withAuth(async ({ userId, req, params: rawParams }) => {
  try {
    const { id } = await rawParams;
    const body = await req.json();

    const task = await prisma.studyRoomTask.create({
      data: { title: body.title, roomId: id },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error('[MOBILE_ROOM_TASKS_POST]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});
