import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logEngagement } from "@/lib/engagement";
import { ReactionType } from "@prisma/client";

export async function GET(req: NextRequest, { params }: { params: { postId: string } }) {
  const session = await auth();
  const userId = session?.user?.id;

  const reactions = await prisma.postReaction.findMany({
    where: { postId: params.postId },
    select: { type: true, userId: true },
  });

  const counts: Record<string, number> = {};
  let userReaction: string | null = null;

  reactions.forEach((r) => {
    counts[r.type] = (counts[r.type] || 0) + 1;
    if (userId && r.userId === userId) {
      userReaction = r.type;
    }
  });

  return NextResponse.json({
    reactions: counts,
    userReaction,
    total: reactions.length,
  });
}

export async function POST(req: NextRequest, { params }: { params: { postId: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const post = await prisma.post.findUnique({ where: { id: params.postId } });
  if (!post || post.interactionsDisabled)
    return NextResponse.json({ error: "Interactions disabled" }, { status: 403 });

  try {
    const { type } = await req.json();

    if (!type) {
      // Remove reaction if type is null/empty
      await prisma.postReaction.deleteMany({
        where: { postId: params.postId, userId },
      });
      return NextResponse.json({ success: true, userReaction: null });
    }

    if (!Object.values(ReactionType).includes(type)) {
      return NextResponse.json({ error: "Invalid reaction type" }, { status: 400 });
    }

    const reaction = await prisma.postReaction.upsert({
      where: { postId_userId: { postId: params.postId, userId } },
      update: { type: type as ReactionType },
      create: { postId: params.postId, userId, type: type as ReactionType },
    });

    await logEngagement(userId, "like").catch(() => {});

    return NextResponse.json({ success: true, userReaction: reaction.type });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to process reaction" }, { status: 500 });
  }
}
