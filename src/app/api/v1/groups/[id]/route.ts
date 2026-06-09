import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET — group details
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const group = await prisma.group.findUnique({
    where: { id: params.id },
    include: {
      owner: { select: { id: true, name: true, image: true } },
      members: {
        include: {
          user: { select: { id: true, name: true, image: true } },
        },
      },
      _count: { select: { members: true, joinRequests: true } },
    },
  });

  if (!group) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isMember = group.members.some(m => m.userId === session.user.id);
  const pendingRequest = !isMember ? await prisma.groupJoinRequest.findUnique({
    where: { groupId_userId: { groupId: params.id, userId: session.user.id } },
  }) : null;

  return NextResponse.json({ ...group, isMember, pendingRequest: pendingRequest?.status || null });
}

// PATCH — update group (owner only)
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const group = await prisma.group.findUnique({ where: { id: params.id } });
  if (!group) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (group.ownerId !== session.user.id) return NextResponse.json({ error: "Only the owner can update this group" }, { status: 403 });

  const body = await req.json();
  const data: any = {};
  if (body.name?.trim()) data.name = body.name.trim();
  if (body.description !== undefined) data.description = body.description?.trim() || null;
  if (body.isPublic !== undefined) data.isPublic = body.isPublic;
  if (body.image !== undefined) data.image = body.image || null;

  const updated = await prisma.group.update({
    where: { id: params.id },
    data,
    include: {
      owner: { select: { id: true, name: true, image: true } },
      _count: { select: { members: true } },
    },
  });

  return NextResponse.json(updated);
}

// DELETE — delete group (owner only)
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const group = await prisma.group.findUnique({ where: { id: params.id } });
  if (!group) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (group.ownerId !== session.user.id) return NextResponse.json({ error: "Only the owner can delete this group" }, { status: 403 });

  await prisma.group.delete({ where: { id: params.id } });

  return NextResponse.json({ success: true });
}
