import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

  const userId = session.user.id;
  const { id } = params;
  const { completed } = await req.json();

  if (completed === undefined) {
    return new NextResponse("Completed status is required", { status: 400 });
  }

  const activity = await prisma.userLectureActivity.upsert({
    where: {
      userId_lectureId: {
        userId,
        lectureId: id,
      },
    },
    update: {
      isCompleted: completed,
    },
    create: {
      userId,
      lectureId: id,
      isCompleted: completed,
    },
  });

  return NextResponse.json(activity);
}
