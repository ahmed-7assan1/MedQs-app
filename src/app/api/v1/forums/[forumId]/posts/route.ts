import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { redisIncrWithExpire } from "@/lib/redis";

const POST_SCHEMA = z.object({
  content: z
    .string()
    .max(5000, "Post too long — max 5000 characters")
    .trim()
    .optional()
    .default(""),
  imageUrl: z.string().url("Invalid image URL").optional().or(z.literal("")),
}).refine((v) => Boolean(v.content?.trim()) || Boolean(v.imageUrl), {
  message: "Post cannot be empty",
  path: ["content"],
});

const POST_RATE_LIMIT = 10; // posts per hour per user

export async function GET(
  req: NextRequest,
  { params }: { params: { forumId: string } }
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page  = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = 20;
  const forum = await prisma.forum.findUnique({
    where: { id: params.forumId },
    select: { type: true },
  });
  if (!forum) return NextResponse.json({ error: "Forum not found" }, { status: 404 });
  if (forum.type === "PRIVATE") {
    const member = await prisma.privateForumMember.findUnique({
      where: { forumId_userId: { forumId: params.forumId, userId: session.user.id } },
      select: { id: true },
    });
    if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const posts = await prisma.post.findMany({
    where: { forumId: params.forumId },
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * limit,
    take: limit,
    include: {
      author: {
        select: {
          id: true, name: true, image: true,
          rank: { select: { label: true, badge: true } },
        },
      },
      _count: { select: { likes: true, comments: true } },
      likes: {
        where: { userId: session.user.id },
        select: { id: true },
      },
    },
  });

  const formatted = posts.map((p) => ({
    ...p,
    likedByMe: p.likes.length > 0,
    likes: undefined,
  }));

  return NextResponse.json(formatted);
}

export async function POST(
  req: NextRequest,
  { params }: { params: { forumId: string } }
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Check forum status
  const forum = await prisma.forum.findUnique({ where: { id: params.forumId } });
  if (!forum)
    return NextResponse.json({ error: "Forum not found" }, { status: 404 });
  if (forum.type === "PRIVATE") {
    const member = await prisma.privateForumMember.findUnique({
      where: { forumId_userId: { forumId: params.forumId, userId: session.user.id } },
      select: { id: true },
    });
    if (!member) return NextResponse.json({ error: "You are not a member of this private forum" }, { status: 403 });
  }
  if (forum.status === "CLOSED" || forum.status === "READ_ONLY")
    return NextResponse.json({ error: "Forum is not accepting posts" }, { status: 403 });

  // Rate limit
  const rlKey = `ratelimit:forum:post:${session.user.id}:${new Date().getHours()}`;
  const count = await redisIncrWithExpire(rlKey, 3600);
  if (count > POST_RATE_LIMIT) {
    return NextResponse.json(
      { error: `Slow down — max ${POST_RATE_LIMIT} posts per hour.` },
      { status: 429 }
    );
  }

  // Validate body
  const body = await req.json();
  const parsed = POST_SCHEMA.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.errors[0]?.message ?? "Invalid input";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const { content, imageUrl } = parsed.data;

  const post = await prisma.post.create({
    data: {
      content,
      imageUrl: imageUrl || undefined,
      authorId: session.user.id,
      forumId: params.forumId,
    },
    include: {
      author: {
        select: {
          id: true, name: true, image: true,
          rank: { select: { label: true, badge: true } },
        },
      },
      _count: { select: { likes: true, comments: true } },
    },
  });

  // Log engagement points (fire-and-forget)
  prisma.engagementLog
    .create({ data: { userId: session.user.id, action: "post", points: 5 } })
    .catch(() => {});
  prisma.user
    .update({ where: { id: session.user.id }, data: { points: { increment: 5 } } })
    .catch(() => {});

  return NextResponse.json({ ...post, likedByMe: false }, { status: 201 });
}
