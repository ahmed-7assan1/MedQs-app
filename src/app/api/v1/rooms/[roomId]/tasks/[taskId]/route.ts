import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logEngagement } from "@/lib/engagement";

type Params = { params: { roomId: string; taskId: string } };

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const task = await prisma.studyRoomTask.findUnique({ where: { id: params.taskId } });
  if (!task || task.roomId !== params.roomId) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const alreadyCompleted = task.completed;
  
  const updated = await prisma.studyRoomTask.update({
    where: { id: params.taskId },
    data: {
      completed: body.completed !== undefined ? body.completed : task.completed,
      title: body.title?.trim() || task.title,
    },
  });

  // Award points if newly completed
  if (body.completed && !alreadyCompleted) {
    await logEngagement(session.user.id, "task_completion");
    
    // Check for speed bonus (within 2 hours)
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    if (new Date(task.createdAt) > twoHoursAgo) {
      await logEngagement(session.user.id, "task_speed_bonus");
    }
  }

  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.studyRoomTask.delete({ where: { id: params.taskId } });
  return NextResponse.json({ ok: true });
}
