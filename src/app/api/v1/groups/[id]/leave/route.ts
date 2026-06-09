import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;

  const group = await prisma.group.findUnique({ where: { id: params.id } });
  if (!group) return NextResponse.json({ error: "Group not found" }, { status: 404 });

  if (group.ownerId === userId) {
    return NextResponse.json({ error: "Owner cannot leave. Delete the group instead." }, { status: 400 });
  }

  const member = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId: params.id, userId } },
  });
  if (!member) return NextResponse.json({ error: "Not a member" }, { status: 400 });

  await prisma.groupMember.delete({ where: { id: member.id } });

  return NextResponse.json({ success: true });
}
