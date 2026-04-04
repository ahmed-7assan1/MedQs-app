import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { redisIncrWithExpire } from "@/lib/redis";
import { loadForumPostsForUser } from "@/lib/forum-posts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const POST_SCHEMA = z
  .object({
    content: z
      .string()
      .max(5000, "Post too long — max 5000 characters")
      .optional()
      .default("")
      .transform((s) => s.trim()),
    imageUrl: z
      .preprocess(
        (v) => {
          if (v == null) return undefined;
          if (typeof v === "string") return v.trim();
          return undefined;
        },
        z.union([z.string().url("Invalid image URL"), z.literal("")]).optional()
      ),
  })
  .refine((v) => Boolean(v.content?.trim()) || Boolean(v.imageUrl?.trim()), {
    message: "Post cannot be empty",
    path: ["content"],
  });

const POST_RATE_LIMIT = 10; // posts per hour per user

type ForumIdParams = { forumId: string };

async function forumIdFromContext(params: ForumIdParams | Promise<ForumIdParams>): Promise<string> {
  const p = await Promise.resolve(params);
  return typeof p?.forumId === "string" ? p.forumId.trim() : "";
}

export async function GET(
  req: NextRequest,
  context: { params: ForumIdParams | Promise<ForumIdParams> }
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const forumId = await forumIdFromContext(context.params);
  if (!forumId)
    return NextResponse.json({ error: "Missing forum id" }, { status: 400 });

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = 20;

  const result = await loadForumPostsForUser({
    forumId,
    userId: session.user.id,
    page,
    limit,
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error, details: result.details, code: result.code },
      { status: result.status }
    );
  }
  return NextResponse.json(result.posts);
}

export async function POST(
  req: NextRequest,
  context: { params: ForumIdParams | Promise<ForumIdParams> }
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const forumId = await forumIdFromContext(context.params);
  if (!forumId)
    return NextResponse.json({ error: "Missing forum id" }, { status: 400 });

  // Check forum status
  const forum = await prisma.forum.findUnique({ where: { id: forumId } });
  if (!forum)
    return NextResponse.json({ error: "Forum not found" }, { status: 404 });
  if (forum.type === "PRIVATE") {
    const member = await prisma.privateForumMember.findUnique({
      where: { forumId_userId: { forumId, userId: session.user.id } },
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
      imageUrl: imageUrl?.trim() || undefined,
      authorId: session.user.id,
      forumId,
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
