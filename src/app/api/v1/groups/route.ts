import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSessionScope } from "@/lib/tenant";

// GET — list public groups + user's joined groups + pending join requests
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const scope = await getSessionScope(session);
  if (!scope?.universityId) return NextResponse.json({ error: "No university" }, { status: 403 });

  const { universityId, userId } = scope;

  const [allGroups, myMemberships, myRequests] = await Promise.all([
    prisma.group.findMany({
      where: { owner: { universityId } },
      include: {
        owner: { select: { id: true, name: true, image: true } },
        _count: { select: { members: true } },
        members: { where: { userId }, select: { id: true, role: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.groupMember.findMany({
      where: { userId },
      include: {
        group: {
          include: {
            owner: { select: { id: true, name: true, image: true } },
            _count: { select: { members: true } },
          },
        },
      },
    }),
    prisma.groupJoinRequest.findMany({
      where: { userId, status: "PENDING" },
      include: {
        group: {
          select: { id: true, name: true, image: true, isPublic: true },
        },
      },
    }),
  ]);

  const memberGroupIds = new Set(myMemberships.map(m => m.groupId));
  const publicGroups = allGroups.filter(g => !memberGroupIds.has(g.id) && g.isPublic && g.ownerId !== userId);

  return NextResponse.json({ publicGroups, myMemberships, myRequests });
}

// POST — create a new group (1 per student enforced)
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const scope = await getSessionScope(session);
  if (!scope) return NextResponse.json({ error: "No university" }, { status: 403 });

  const { universityId, userId } = scope;

  const existing = await prisma.group.findUnique({ where: { ownerId: userId } });
  if (existing) {
    return NextResponse.json({ error: "You already own a group. Delete it first to create a new one." }, { status: 400 });
  }

  const body = await req.json();
  const { name, description, isPublic } = body;
  if (!name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });

  const group = await prisma.group.create({
    data: {
      name: name.trim(),
      description: description?.trim() || null,
      isPublic: isPublic !== false,
      ownerId: userId,
      members: {
        create: { userId, role: "OWNER" },
      },
    },
    include: {
      owner: { select: { id: true, name: true, image: true } },
      _count: { select: { members: true } },
    },
  });

  return NextResponse.json(group);
}
