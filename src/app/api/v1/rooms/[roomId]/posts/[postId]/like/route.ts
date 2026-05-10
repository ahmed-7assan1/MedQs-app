import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: { roomId: string; postId: string } | Promise<{ roomId: string; postId: string }> };

async function getParams(params: Params["params"]) {
  return await Promise.resolve(params);
}

export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;
  const { roomId, postId } = await getParams(params);

  // Verify membership
  const isMember = await prisma.studyRoomMember.findUnique({ where: { roomId_userId: { roomId, userId } } });
  if (!isMember) return NextResponse.json({ error: "Not a member" }, { status: 403 });

  try {
    const existing = await prisma.studyRoomPostLike.findUnique({
      where: { postId_userId: { postId, userId } }
    });

    if (existing) {
      await prisma.studyRoomPostLike.delete({ where: { id: existing.id } });
      return NextResponse.json({ liked: false });
    } else {
      await prisma.studyRoomPostLike.create({ data: { postId, userId } });
      return NextResponse.json({ liked: true });
    }
  } catch (err: any) {
    return NextResponse.json({ error: "Operation failed", details: err.message }, { status: 500 });
  }
}
