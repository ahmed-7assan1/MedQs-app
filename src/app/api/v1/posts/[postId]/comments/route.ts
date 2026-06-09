import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { publishNotification, redisIncrWithExpire } from "@/lib/redis";

const COMMENT_SCHEMA = z.object({
  content:  z.string().max(1000).trim().optional().default(""),
  parentId: z.string().nullable().optional(),
  attachments: z.array(z.any()).optional(),
}).refine(data => data.content || (data.attachments && data.attachments.length > 0), {
  message: "Comment cannot be empty"
});
const RATE_LIMIT = 20;

export async function GET(req: NextRequest, { params }: { params: { postId: string } }) {
  const session = await auth();
  const userId = session?.user?.id;

  const { searchParams } = new URL(req.url);
  const top = searchParams.get("top");

  const blockedIds = userId ? await prisma.blockedUser.findMany({
    where: { userId },
    select: { blockedId: true },
  }) : [];
  const blockedSet = new Set(blockedIds.map(b => b.blockedId));

  // Only top-level comments (parentId = null)
  const comments = await prisma.comment.findMany({
    where: {
      postId: params.postId,
      parentId: null,
      ...(blockedSet.size > 0 ? { authorId: { notIn: [...blockedSet] } } : {}),
    },
    orderBy: top ? { likes: { _count: "desc" } } : { createdAt: "asc" },
    take: top ? parseInt(top) : undefined,
    include: {
      author: {
        select: { id: true, name: true, nickname: true, image: true, hideRank: true,
          rank: { select: { label: true, badge: true } } },
      },
      _count: { select: { likes: true } },
      likes: userId ? { where: { userId }, select: { id: true } } : false,
      replies: {
        orderBy: { createdAt: "asc" },
        include: {
          author: {
            select: { id: true, name: true, nickname: true, image: true, hideRank: true,
              rank: { select: { label: true, badge: true } } },
          },
          _count: { select: { likes: true } },
          likes: userId ? { where: { userId }, select: { id: true } } : false,
        },
      },
    },
  });

  const formatted = comments.map(c => ({
    ...c,
    likedByMe: userId ? c.likes.length > 0 : false,
    likes: undefined,
    replies: c.replies
      .filter(r => !blockedSet.has(r.authorId))
      .map(r => ({
        ...r,
        likedByMe: userId ? (r.likes as any[]).length > 0 : false,
        likes: undefined,
      })),
  }));

  return NextResponse.json(formatted);
}

export async function POST(req: NextRequest, { params }: { params: { postId: string } }) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const post = await prisma.post.findUnique({ where: { id: params.postId } });
  if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });
  if (post.interactionsDisabled) return NextResponse.json({ error: "Interactions disabled" }, { status: 403 });
  const universityId = post.universityId;

  // Rate limit
  const rlKey = `ratelimit:forum:comment:${userId}:${new Date().getHours()}`;
  const count = await redisIncrWithExpire(rlKey, 3600);
  if (count > RATE_LIMIT) {
    return NextResponse.json({ error: `Max ${RATE_LIMIT} comments per hour` }, { status: 429 });
  }

  const body = await req.json();
  const parsed = COMMENT_SCHEMA.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message }, { status: 400 });
  }

  const comment = await prisma.comment.create({
    data: {
      content:  parsed.data.content,
      attachments: parsed.data.attachments || undefined,
      authorId: userId,
      postId:   params.postId,
      parentId: parsed.data.parentId ?? null,
      universityId,
    },
    include: {
      author: {
        select: { id: true, name: true, nickname: true, image: true, hideRank: true,
          rank: { select: { label: true, badge: true } } },
      },
      _count: { select: { likes: true } },
    },
  });

  // Points
  prisma.user.update({ where: { id: userId }, data: { points: { increment: 2 } } }).catch(() => {});

  const author = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, nickname: true },
  });
  const label = (author?.nickname || author?.name || "Someone").trim() || "Someone";
  const snippet =
    parsed.data.content.length > 160 ? `${parsed.data.content.slice(0, 157)}…` : parsed.data.content;

  async function notifyUser(targetUserId: string, title: string, body: string) {
    if (targetUserId === userId) return;
    const n = await prisma.notification.create({
      data: { userId: targetUserId, title, body, channel: "FORUM" },
    });
    await publishNotification(targetUserId, {
      id: n.id,
      title: n.title,
      body: n.body,
      read: false,
      createdAt: n.createdAt.toISOString(),
      channel: n.channel,
    });
  }

  if (parsed.data.parentId) {
    const parent = await prisma.comment.findUnique({
      where: { id: parsed.data.parentId },
      select: { authorId: true },
    });
    if (parent?.authorId) {
      await notifyUser(parent.authorId, "Reply to your comment", `${label}: ${snippet}`);
    }
  } else if (post.authorId !== userId) {
    await notifyUser(post.authorId, "New comment on your post", `${label}: ${snippet}`);
  }

  return NextResponse.json({ ...comment, likedByMe: false, replies: [] }, { status: 201 });
}
