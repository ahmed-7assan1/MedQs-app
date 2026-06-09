import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: { id: string; requestId: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const group = await prisma.group.findUnique({ where: { id: params.id } });
  if (!group) return NextResponse.json({ error: "Group not found" }, { status: 404 });
  if (group.ownerId !== session.user.id) return NextResponse.json({ error: "Only the owner can handle join requests" }, { status: 403 });

  const request = await prisma.groupJoinRequest.findUnique({
    where: { id: params.requestId },
  });
  if (!request || request.groupId !== params.id) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }
  if (request.status !== "PENDING") {
    return NextResponse.json({ error: "Request already handled" }, { status: 400 });
  }

  const body = await req.json();
  const { action } = body; // "APPROVE" or "REJECT"

  if (action === "APPROVE") {
    // Check membership limit
    const membershipCount = await prisma.groupMember.count({ where: { userId: request.userId } });
    if (membershipCount >= 5) {
      await prisma.groupJoinRequest.update({
        where: { id: request.id },
        data: { status: "REJECTED" },
      });
      return NextResponse.json({ error: "User is already in 5 groups" }, { status: 400 });
    }

    await prisma.$transaction([
      prisma.groupMember.create({
        data: { groupId: params.id, userId: request.userId, role: "MEMBER" },
      }),
      prisma.groupJoinRequest.update({
        where: { id: request.id },
        data: { status: "APPROVED" },
      }),
    ]);

    // Notify the requester
    await prisma.notification.create({
      data: {
        title: "Request Approved",
        body: `You have been accepted into "${group.name}"`,
        userId: request.userId,
      },
    });

    return NextResponse.json({ success: true, status: "approved" });
  } else if (action === "REJECT") {
    await prisma.groupJoinRequest.update({
      where: { id: request.id },
      data: { status: "REJECTED" },
    });

    return NextResponse.json({ success: true, status: "rejected" });
  }

  return NextResponse.json({ error: "Invalid action. Use APPROVE or REJECT." }, { status: 400 });
}
