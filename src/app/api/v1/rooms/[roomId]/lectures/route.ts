import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSessionScope } from "@/lib/tenant";
export const dynamic = "force-dynamic";

type Params = { params: { roomId: string } };

export async function GET(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const scope = await getSessionScope(session);
  if (!scope) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const room = await prisma.studyRoom.findUnique({
    where: { id: params.roomId },
    select: { universityId: true },
  });
  if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });

  const user = await prisma.user.findUnique({
    where: { id: scope.userId },
    select: { semesterId: true },
  });

  const lectures = await prisma.lecture.findMany({
    where: {
      subject: {
        module: {
          semester: {
            academicYear: {
              universityId: room.universityId,
            },
            ...(user?.semesterId ? { id: user.semesterId } : {}),
          },
        },
      },
    },
    select: {
      id: true,
      title: true,
      type: true,
      subject: {
        select: {
          id: true,
          name: true,
          module: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: [
      { subject: { module: { name: "asc" } } },
      { subject: { name: "asc" } },
      { order: "asc" },
    ],
    take: 200,
  });

  return NextResponse.json(lectures);
}
