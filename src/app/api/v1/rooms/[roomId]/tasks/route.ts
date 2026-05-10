import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSessionScope } from "@/lib/tenant";

type Params = { params: { roomId: string } };

async function requireMember(roomId: string, userId: string) {
  return !!(await prisma.studyRoomMember.findUnique({ where: { roomId_userId: { roomId, userId } } }));
}

export async function GET(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const scope = await getSessionScope(session);
  if (!scope || !(await requireMember(params.roomId, scope.userId))) {
    return NextResponse.json({ error: "Not a member" }, { status: 403 });
  }

  const tasks = await prisma.studyRoomTask.findMany({
    where: { roomId: params.roomId },
    orderBy: [{ completed: "asc" }, { deadline: "asc" }, { createdAt: "desc" }],
  });
  return NextResponse.json(tasks);
}

export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const scope = await getSessionScope(session);
  if (!scope || !(await requireMember(params.roomId, scope.userId))) {
    return NextResponse.json({ error: "Not a member" }, { status: 403 });
  }

  const { title, description, deadline } = await req.json();
  if (!title?.trim()) return NextResponse.json({ error: "Title required" }, { status: 400 });

  const task = await prisma.studyRoomTask.create({
    data: {
      title: title.trim(),
      description: description?.trim() || null,
      deadline: deadline ? new Date(deadline) : null,
      roomId: params.roomId,
    },
  });
  return NextResponse.json(task, { status: 201 });
}
