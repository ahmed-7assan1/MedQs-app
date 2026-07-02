import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { redisIncrWithExpire } from "@/lib/redis";
import { defer } from "@/lib/defer";
import { loadForumPostsForUser } from "@/lib/forum-posts";
import { unstable_cache } from "next/cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ─── Cached historical posts loader ──────────────────────────────────────────
// Each forumId+page combo is cached for 30s in Vercel Data Cache.
// Real-time NEW posts come instantly via Firestore WebSockets (no DB needed).
const getCachedPosts = (forumId: string, userId: string, page: number, limit: number) =>
  loadForumPostsForUser({ forumId, userId, page, limit });
/*
  unstable_cache(
    () => loadForumPostsForUser({ forumId, userId, page, limit: 20 }),
    [`forum-posts-${forumId}-${page}`],
    { revalidate: 30, tags: [`forum-${forumId}`] }
  )();
*/

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
        z.union([
          z.string().refine(
            (s) => s.startsWith("/") || s.startsWith("http://") || s.startsWith("https://") || s.startsWith("data:image/"),
            { message: "Invalid image URL" }
          ),
          z.literal("")
        ]).optional()
      ),
    attachments: z.array(z.any()).optional(),
    audience: z.enum(["UNIVERSITY", "FOLLOWERS"]).optional(),
    isForumPost: z.boolean().optional().default(true),
    isChatMessage: z.boolean().optional().default(false),
    chatForumId: z.string().optional(),
    sharedQuestion: z.any().optional(),
    poll: z.object({
      question: z.string(),
      options: z.array(z.string())
    }).optional(),
    postType: z.string().optional(),
    qaAnswer: z.string().optional(),
    hashtags: z.array(z.string()).optional(),
    isAnonymous: z.boolean().optional().default(false),
    backgroundStyle: z.string().optional()
  })
  .refine((v) => Boolean(v.content?.trim()) || Boolean(v.imageUrl?.trim()) || (v.attachments && v.attachments.length > 0) || Boolean(v.sharedQuestion) || Boolean(v.poll) || (v.postType === 'qa' && v.poll), {
    message: "Post cannot be empty",
    path: ["content"],
  });

const POST_RATE_LIMIT = 1000; // Increased limit

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
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? 20)));

  // Use cached loader for historical posts. Firebase handles real-time updates.
  const result = await getCachedPosts(forumId, session.user.id, page, limit);

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error, details: result.details, code: result.code },
      { status: result.status }
    );
  }

  return NextResponse.json(result.posts, {
    headers: {
      // Vercel Edge & browser: serve cache for 30s, allow stale for 60s while revalidating
      "Cache-Control": "s-maxage=30, stale-while-revalidate=60",
    },
  });
}

export async function POST(
  req: NextRequest,
  context: { params: ForumIdParams | Promise<ForumIdParams> }
) {
  const session = await auth();
  const userId = session?.user?.id;
  const userRole = (session?.user as any)?.role;

  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const forumId = await forumIdFromContext(context.params);
  if (!forumId)
    return NextResponse.json({ error: "Missing forum id" }, { status: 400 });

  // Check forum status
  const forum = await prisma.forum.findUnique({ where: { id: forumId } });
  if (!forum)
    return NextResponse.json({ error: "Forum not found" }, { status: 404 });
  const universityId = forum.universityId;
  if (!universityId) return NextResponse.json({ error: "Forum misconfigured (missing university)" }, { status: 500 });
  if (forum.type === "PRIVATE") {
    const member = await prisma.privateForumMember.findUnique({
      where: { forumId_userId: { forumId, userId } },
      select: { id: true },
    });
    if (!member) return NextResponse.json({ error: "You are not a member of this private forum" }, { status: 403 });
  }
  if (forum.status === "CLOSED" || forum.status === "READ_ONLY")
    return NextResponse.json({ error: "Forum is not accepting posts" }, { status: 403 });

  // Rate limit (Exempt Admins)
  if (userRole !== "ADMIN" && userRole !== "SUPER_ADMIN") {
    const rlKey = `ratelimit:forum:post:${userId}:${new Date().getHours()}`;
    const count = await redisIncrWithExpire(rlKey, 3600);
    if (count > POST_RATE_LIMIT) {
      return NextResponse.json(
        { error: `Slow down — max ${POST_RATE_LIMIT} posts per hour.` },
        { status: 429 }
      );
    }
  }

  // Validate body
  try {
    const body = await req.json();
    const parsed = POST_SCHEMA.safeParse(body);
    if (!parsed.success) {
      console.error("[POST-API] Validation Failed:", parsed.error.format());
      const message = parsed.error.errors[0]?.message ?? "Invalid input";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const { content, imageUrl, attachments, hashtags, isAnonymous, backgroundStyle } = parsed.data;
    const audience = parsed.data.audience ?? "UNIVERSITY";

    // Calculate expiry (10 days from now)
    // Handle Poll creation separately to avoid nested create issues
    let createdPollId: string | undefined = undefined;
    if (parsed.data.poll && parsed.data.postType !== 'qa') {
      const newPoll = await prisma.poll.create({
        data: {
          question: parsed.data.poll.question,
          options: {
            create: parsed.data.poll.options.map(text => ({ text }))
          }
        }
      });
      createdPollId = newPoll.id;
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 10);

    const post = await (prisma.post as any).create({
      data: {
        content,
        imageUrl: imageUrl?.trim() || undefined,
        attachments: attachments || undefined,
        authorId: userId,
        forumId: (parsed.data.isChatMessage && parsed.data.chatForumId) ? parsed.data.chatForumId : forumId,
        universityId,
        audience,
        expiresAt,
        isForumPost: parsed.data.isForumPost,
        isChatMessage: parsed.data.isChatMessage,
        isAnonymous,
        backgroundStyle,
        ...(parsed.data.sharedQuestion ? {
          sharedQuestionId: parsed.data.sharedQuestion.id,
          sharedQuestionData: parsed.data.sharedQuestion
        } : {}),
        ...(parsed.data.postType === 'qa' && parsed.data.poll ? {
          sharedQuestionData: {
            question: parsed.data.poll.question,
            options: parsed.data.poll.options,
            type: 'qa',
            correctAnswer: parsed.data.qaAnswer || null
          }
        } : {}),
        pollId: createdPollId,
      },
      include: {
        author: {
          select: {
            id: true, name: true, image: true,
            rank: { select: { label: true, badge: true } },
          },
        },
        _count: { select: { likes: true, comments: true } },
        poll: { include: { options: { include: { _count: { select: { votes: true } } } } } },
        sharedQuestion: { select: { id: true, body: true, choices: true, answer: true, difficulty: true } }
      },
    });

    // Handle Hashtags Persistence
    if (hashtags && hashtags.length > 0) {
      try {
        for (const tag of hashtags) {
          const name = tag.startsWith('#') ? tag.slice(1).toLowerCase() : tag.toLowerCase();
          if (!name) continue;
          
          const hashtagRecord = await prisma.hashtag.upsert({
            where: { name },
            create: { name, count: 1 },
            update: { count: { increment: 1 } }
          });

          await prisma.postHashtag.create({
            data: { postId: post.id, hashtagId: hashtagRecord.id }
          });
        }
      } catch (hError) {
        console.error("[POST-API] Hashtag processing failed:", hError);
      }
    }

    const returnPost = { ...post, likedByMe: false };

    // Defer engagement logging + Firestore sync (don't block the response)
    defer(async () => {
      await Promise.allSettled([
        prisma.engagementLog.create({ data: { userId, action: "post", points: 5 } }),
        prisma.user.update({ where: { id: userId }, data: { points: { increment: 5 } } }),
      ]);
      try {
        const { adminDb } = await import("@/lib/firebase/admin");
        const firestorePost = JSON.parse(JSON.stringify(returnPost));
        await adminDb.doc(`forums/${forumId}/posts/${post.id}`).set(firestorePost);
      } catch (firebaseErr) {
        console.error("[POST-API] Firestore sync failed:", firebaseErr);
      }
    });

    return NextResponse.json(returnPost, { status: 201 });
  } catch (err: any) {
    console.error("[POST-API] Server Error:", err.message);
    return NextResponse.json({ error: err.message || "Server Error", details: err.message }, { status: 500 });
  }
}
