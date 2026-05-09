import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSessionScope } from "@/lib/tenant";

export const dynamic = "force-dynamic";

// GET /api/v1/community/messages?cursor=<id>&limit=50
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const scope = await getSessionScope(session);
  if (!scope?.universityId) return NextResponse.json({ error: "No university" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get("cursor");
  const limit = Math.min(parseInt(searchParams.get("limit") || "60"), 100);

  // Find the "GLOBAL" community forum for this university
  const forum = await prisma.forum.findFirst({
    where: { universityId: scope.universityId, type: "GLOBAL" },
    select: { id: true },
  });

  if (!forum) return NextResponse.json({ messages: [], nextCursor: null });

  const messages = await prisma.post.findMany({
    where: {
      forumId: forum.id,
      isChatMessage: true,
      isForumPost: false,
    },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: {
      author: {
        select: {
          id: true,
          name: true,
          image: true,
          role: true,
          rank: { select: { label: true, badge: true } },
        },
      },
    },
  });

  let nextCursor: string | null = null;
  if (messages.length > limit) {
    nextCursor = messages[limit].id;
    messages.pop();
  }

  // Reverse so oldest first (chronological order)
  return NextResponse.json({
    messages: messages.reverse(),
    nextCursor,
    forumId: forum.id,
  });
}

// POST /api/v1/community/messages
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const scope = await getSessionScope(session);
  if (!scope?.universityId) return NextResponse.json({ error: "No university" }, { status: 403 });

  const body = await req.json();
  const { content, attachments } = body;

  if (!content?.trim() && (!attachments || attachments.length === 0)) {
    return NextResponse.json({ error: "Empty message" }, { status: 400 });
  }

  // Find the GLOBAL community forum for this university
  let forum = await prisma.forum.findFirst({
    where: { universityId: scope.universityId, type: "GLOBAL" },
  });

  // Auto-create if missing
  if (!forum) {
    forum = await prisma.forum.create({
      data: {
        name: "Community Discussion",
        type: "GLOBAL",
        universityId: scope.universityId,
      },
    });
  }

  const message = await prisma.post.create({
    data: {
      content: content?.trim() || "",
      attachments: attachments ?? [],
      authorId: scope.userId,
      forumId: forum.id,
      universityId: scope.universityId,
      isChatMessage: true,
      isForumPost: false,
      audience: "UNIVERSITY",
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          image: true,
          role: true,
          rank: { select: { label: true, badge: true } },
        },
      },
    },
  });

  return NextResponse.json({ message });
}
