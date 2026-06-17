import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { postId } = await params;
  const { optionId } = await req.json();
  if (!optionId) {
    return NextResponse.json({ error: "optionId required" }, { status: 400 });
  }

  const post = await (prisma.post as any).findUnique({
    where: { id: postId },
    include: { poll: { include: { options: true } } },
  });

  if (!post?.poll) {
    return NextResponse.json({ error: "Poll not found" }, { status: 404 });
  }

  const option = post.poll.options.find((o: any) => o.id === optionId);
  if (!option) {
    return NextResponse.json({ error: "Option not found" }, { status: 404 });
  }

  if (post.poll.expiresAt && new Date(post.poll.expiresAt) < new Date()) {
    return NextResponse.json({ error: "Poll has expired" }, { status: 400 });
  }

  try {
    await (prisma as any).pollVote.create({
      data: {
        pollOptionId: optionId,
        userId: session.user.id,
      },
    });
  } catch (err: any) {
    if (err.code === "P2002") {
      return NextResponse.json({ error: "Already voted" }, { status: 409 });
    }
    throw err;
  }

  const totalVotes = await (prisma as any).pollVote.count({
    where: { pollOption: { pollId: post.poll.id } },
  });

  const updatedOptions = await Promise.all(
    post.poll.options.map(async (o: any) => ({
      id: o.id,
      label: o.text,
      votes: await (prisma as any).pollVote.count({
        where: { pollOptionId: o.id },
      }),
    }))
  );

  return NextResponse.json({
    options: updatedOptions,
    totalVotes,
    userVotedOptionId: optionId,
  });
}
