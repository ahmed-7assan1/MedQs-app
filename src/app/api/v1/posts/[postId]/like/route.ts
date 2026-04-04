import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logEngagement } from "@/lib/engagement";

export async function POST(req: NextRequest, { params }: { params: { postId: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const post = await prisma.post.findUnique({ where: { id: params.postId } });
  if (!post || post.interactionsDisabled)
    return NextResponse.json({ error: "Interactions disabled" }, { status: 403 });

  const existing = await prisma.like.findUnique({
    where: { userId_postId: { userId: session.user.id, postId: params.postId } },
  });

  if (existing) {
    await prisma.like.delete({ where: { id: existing.id } });
    return NextResponse.json({ liked: false });
  } else {
    await prisma.like.create({ data: { userId: session.user.id, postId: params.postId } });
    await logEngagement(session.user.id, "like").catch(() => {
      /* points/rank are best-effort; like must still succeed */
    });
    return NextResponse.json({ liked: true });
  }
}
