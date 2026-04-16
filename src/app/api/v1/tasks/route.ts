import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

  const userId = session.user.id;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const tasks = await prisma.userTask.findMany({
    where: {
      userId,
      date: {
        gte: today,
        lt: tomorrow,
      },
    },
    orderBy: {
      time: "asc",
    },
  });

  return NextResponse.json(tasks);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

  const userId = session.user.id;
  const { title, description, time, date, lectureId } = await req.json();

  if (!title) return new NextResponse("Title is required", { status: 400 });

  const task = await prisma.userTask.create({
    data: {
      title,
      description,
      time,
      date: date ? new Date(date) : new Date(),
      lectureId,
      userId,
    },
  });

  return NextResponse.json(task);
}
