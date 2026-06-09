import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const group = await prisma.group.findUnique({ where: { id: params.id } });
  if (!group) return NextResponse.json({ error: "Group not found" }, { status: 404 });
  if (group.ownerId !== session.user.id) return NextResponse.json({ error: "Only the owner can kick members" }, { status: 403 });

  const { userId: targetUserId } = await req.json();
  if (!targetUserId) return NextResponse.json({ error: "userId is required" }, { status: 400 });
  if (targetUserId === group.ownerId) return NextResponse.json({ error: "Cannot kick the owner" }, { status: 400 });

  const member = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId: params.id, userId: targetUserId } },
  });
  if (!member) return NextResponse.json({ error: "User is not a member" }, { status: 400 });

  await prisma.groupMember.delete({ where: { id: member.id } });

  return NextResponse.json({ success: true });
}
