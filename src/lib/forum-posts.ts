import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/** JSON shape returned by GET /api/v1/forums/[forumId]/posts and SSR forum feed */
export type ForumPostJson = {
  id: string;
  content: string;
  imageUrl: string | null;
  interactionsDisabled: boolean;
  authorId: string;
  forumId: string;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    name: string;
    image: string | null;
    rank?: { label: string; badge: string | null };
  };
  _count: { likes: number; comments: number };
  likedByMe: boolean;
};

type PostRow = {
  id: string;
  content: string;
  imageUrl: string | null;
  interactionsDisabled: boolean;
  authorId: string;
  forumId: string;
  createdAt: Date;
  updatedAt: Date;
  author: {
    id: string;
    name: string;
    image: string | null;
    rank?: { label: string; badge: string | null } | null;
  };
  _count: { likes: number; comments: number };
};

export async function loadForumPostsForUser(options: {
  forumId: string;
  userId: string;
  page?: number;
  limit?: number;
}): Promise<
  | { ok: true; posts: ForumPostJson[] }
  | { ok: false; status: number; error: string; details?: string; code?: string }
> {
  const { userId, page = 1, limit = 20 } = options;
  const forumId = options.forumId.trim();
  if (!forumId) return { ok: false, status: 400, error: "Missing forum id" };

  try {
    const forum = await prisma.forum.findUnique({
      where: { id: forumId },
      select: { type: true },
    });
    if (!forum) return { ok: false, status: 404, error: "Forum not found" };
    if (forum.type === "PRIVATE") {
      const member = await prisma.privateForumMember.findUnique({
        where: { forumId_userId: { forumId, userId } },
        select: { id: true },
      });
      if (!member) return { ok: false, status: 403, error: "Forbidden" };
    }

    const skip = (Math.max(1, page) - 1) * limit;

    let posts: PostRow[];

    try {
      posts = (await prisma.post.findMany({
        where: { forumId },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          author: {
            select: {
              id: true,
              name: true,
              image: true,
              rank: { select: { label: true, badge: true } },
            },
          },
          _count: { select: { likes: true, comments: true } },
        },
      })) as PostRow[];
    } catch (inner) {
      console.error("[forum-posts] full query failed, retrying without rank", inner);
      try {
        posts = (await prisma.post.findMany({
          where: { forumId },
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
          include: {
            author: {
              select: { id: true, name: true, image: true },
            },
            _count: { select: { likes: true, comments: true } },
          },
        })) as PostRow[];
      } catch (inner2) {
        console.error("[forum-posts] retry without rank failed, retrying without _count", inner2);
        const bare = await prisma.post.findMany({
          where: { forumId },
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
          include: {
            author: { select: { id: true, name: true, image: true } },
          },
        });
        posts = bare.map((p) => ({
          ...p,
          _count: { likes: 0, comments: 0 },
        })) as PostRow[];
      }
    }

    const postIds = posts.map((p) => p.id);
    let likedSet = new Set<string>();
    try {
      const likedRows =
        postIds.length === 0
          ? []
          : await prisma.like.findMany({
              where: { userId, postId: { in: postIds } },
              select: { postId: true },
            });
      likedSet = new Set(likedRows.map((r) => r.postId));
    } catch (le) {
      console.error("[forum-posts] like.findMany failed", le);
    }

    const formatted: ForumPostJson[] = posts.map((p) => ({
      id: p.id,
      content: p.content,
      imageUrl: p.imageUrl,
      interactionsDisabled: p.interactionsDisabled,
      authorId: p.authorId,
      forumId: p.forumId,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
      author: {
        id: p.author.id,
        name: p.author.name,
        image: p.author.image,
        ...(p.author.rank ? { rank: p.author.rank } : {}),
      },
      _count: p._count,
      likedByMe: likedSet.has(p.id),
    }));

    return { ok: true, posts: formatted };
  } catch (e) {
    console.error("[forum-posts]", e);
    const message = e instanceof Error ? e.message : String(e);
    const code = e instanceof Prisma.PrismaClientKnownRequestError ? e.code : undefined;
    return { ok: false, status: 500, error: "Failed to load posts", details: message, code };
  }
}
