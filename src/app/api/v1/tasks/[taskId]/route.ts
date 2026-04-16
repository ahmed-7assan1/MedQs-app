import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH(
  req: Request,
  { params }: { params: { taskId: string } }
) {
  const session = await auth();
  if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

  const userId = session.user.id;
  const { taskId } = params;
  const { completed, title, description, time } = await req.json();

  const task = await prisma.userTask.findUnique({
    where: { id: taskId },
  });

  if (!task || task.userId !== userId) {
    return new NextResponse("Not Found", { status: 404 });
  }

  // If this task was linked to a lecture, and we are marking it as completed,
  // we might want to also update the UserLectureActivity.
  if (task.lectureId && completed !== undefined) {
    await prisma.userLectureActivity.upsert({
      where: {
        userId_lectureId: {
          userId,
          lectureId: task.lectureId,
        },
      },
      update: {
        isCompleted: completed,
      },
      create: {
        userId,
        lectureId: task.lectureId,
        isCompleted: completed,
      },
    });
  }

  const updatedTask = await prisma.userTask.update({
    where: { id: taskId },
    data: {
      completed: completed ?? task.completed,
      title: title ?? task.title,
      description: description ?? task.description,
      time: time ?? task.time,
    },
  });

  return NextResponse.json(updatedTask);
}

export async function DELETE(
  _req: Request,
  { params }: { params: { taskId: string } }
) {
  const session = await auth();
  if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

  const userId = session.user.id;
  const { taskId } = params;

  const task = await prisma.userTask.findUnique({
    where: { id: taskId },
  });

  if (!task || task.userId !== userId) {
    return new NextResponse("Not Found", { status: 404 });
  }

  await prisma.userTask.delete({
    where: { id: taskId },
  });

  return new NextResponse(null, { status: 204 });
}
