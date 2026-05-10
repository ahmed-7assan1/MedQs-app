import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSessionScope } from "@/lib/tenant";

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

// GET — list public rooms for the user's university
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const scope = await getSessionScope(session);
  if (!scope?.universityId) return NextResponse.json({ error: "No university" }, { status: 403 });

  const { universityId, userId } = scope;

  const rooms = await prisma.studyRoom.findMany({
    where: { universityId },
    include: {
      owner: { select: { id: true, name: true, image: true } },
      _count: { select: { members: true, posts: true } },
      members: { where: { userId }, select: { id: true, role: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json(rooms);
}

// POST — create a new room (1 per student enforced)
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const scope = await getSessionScope(session);
  if (!scope?.universityId) return NextResponse.json({ error: "No university" }, { status: 403 });

  const { universityId, userId } = scope;

  // Enforce 1 room per student
  const existing = await prisma.studyRoom.findUnique({ where: { ownerId: userId } });
  if (existing) {
    return NextResponse.json({ error: "You already own a room. Delete it first to create a new one." }, { status: 400 });
  }

  const body = await req.json();
  const { name, description, isPublic, memberLimit } = body;
  if (!name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });

  // Generate unique invite code
  let inviteCode = generateCode();
  let attempts = 0;
  while (attempts < 10) {
    const conflict = await prisma.studyRoom.findUnique({ where: { inviteCode } });
    if (!conflict) break;
    inviteCode = generateCode();
    attempts++;
  }

  const room = await prisma.studyRoom.create({
    data: {
      name: name.trim(),
      description: description?.trim() || null,
      isPublic: isPublic !== false,
      memberLimit: Math.min(Math.max(Number(memberLimit) || 10, 2), 50),
      inviteCode,
      ownerId: userId,
      universityId,
      members: {
        create: { userId, role: "OWNER" },
      },
    },
    include: {
      owner: { select: { id: true, name: true, image: true } },
      _count: { select: { members: true } },
    },
  });

  return NextResponse.json(room, { status: 201 });
}
