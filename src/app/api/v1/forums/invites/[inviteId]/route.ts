import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: { inviteId: string } }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { action } = await req.json(); // "accept" | "decline"

  const invite = await prisma.privateForumInvite.findUnique({
    where: { id: params.inviteId },
  });

  if (!invite || invite.receiverId !== session.user.id) {
    return NextResponse.json({ error: "Invite not found" }, { status: 404 });
  }

  if (action === "accept") {
    await Promise.all([
      prisma.privateForumInvite.update({
        where: { id: params.inviteId },
        data: { status: "accepted" },
      }),
      prisma.privateForumMember.upsert({
        where: { forumId_userId: { forumId: invite.forumId, userId: session.user.id } },
        create: { forumId: invite.forumId, userId: session.user.id },
        update: {},
      }),
    ]);
    return NextResponse.json({ joined: true });
  }

  if (action === "decline") {
    await prisma.privateForumInvite.update({
      where: { id: params.inviteId },
      data: { status: "declined" },
    });
    return NextResponse.json({ declined: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
