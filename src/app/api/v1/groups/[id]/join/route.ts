import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;

  const group = await prisma.group.findUnique({
    where: { id: params.id },
    include: { _count: { select: { members: true } } },
  });
  if (!group) return NextResponse.json({ error: "Group not found" }, { status: 404 });

  // Check max 5 groups membership
  const membershipCount = await prisma.groupMember.count({ where: { userId } });
  if (membershipCount >= 5) {
    return NextResponse.json({ error: "You can only be in 5 groups maximum. Leave one first." }, { status: 400 });
  }

  // Check if already a member
  const existingMember = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId: params.id, userId } },
  });
  if (existingMember) {
    return NextResponse.json({ error: "Already a member" }, { status: 400 });
  }

  // Check if already requested
  const existingRequest = await prisma.groupJoinRequest.findUnique({
    where: { groupId_userId: { groupId: params.id, userId } },
  });
  if (existingRequest && existingRequest.status === "PENDING") {
    return NextResponse.json({ error: "Join request already pending" }, { status: 400 });
  }

  if (group.isPublic) {
    // Public — join immediately
    await prisma.groupMember.create({
      data: { groupId: params.id, userId, role: "MEMBER" },
    });

    // Create notification for owner
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
    await prisma.notification.create({
      data: {
        title: "New Member",
        body: `${user?.name || "Someone"} joined your group "${group.name}"`,
        userId: group.ownerId,
      },
    });

    return NextResponse.json({ success: true, status: "joined" });
  } else {
    // Private — create join request
    const request = await prisma.groupJoinRequest.create({
      data: { groupId: params.id, userId, status: "PENDING" },
    });

    // Notify owner
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
    await prisma.notification.create({
      data: {
        title: "Join Request",
        body: `${user?.name || "Someone"} wants to join your group "${group.name}"`,
        userId: group.ownerId,
      },
    });

    return NextResponse.json({ success: true, status: "requested", requestId: request.id });
  }
}
