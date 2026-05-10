import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/** JSON shape returned by GET /api/v1/forums/[forumId]/posts and SSR forum feed */
export type ForumPostJson = {
  id: string;
  content: string;
  imageUrl: string | null;
  attachments?: any;
  interactionsDisabled: boolean;
  authorId: string;
  forumId: string;
  createdAt: string;
  updatedAt: string;
  expiresAt: string | null;
  isPinned: boolean;
  author: {
    id: string;
    name: string;
    image: string | null;
    handle: string | null;
    rank?: { label: string; badge: string | null };
  };
  _count: { likes: number; comments: number };
  likedByMe: boolean;
};

type PostRow = {
  id: string;
  content: string;
  imageUrl: string | null;
  attachments?: any;
  interactionsDisabled: boolean;
  authorId: string;
  forumId: string;
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date | null;
  isPinned: boolean;
  author: {
    id: string;
    name: string;
    image: string | null;
    handle: string | null;
    rank?: { label: string; badge: string | null } | null;
  };
  _count: { likes: number; comments: number };
};

export async function loadForumPostsForUser(options: {
  forumId: string;
  userId: string;
  page?: number;
  limit?: number;
  isChatMessage?: boolean;
  isForumPost?: boolean;
}): Promise<
  | { ok: true; posts: ForumPostJson[] }
  | { ok: false; status: number; error: string; details?: string; code?: string }
> {
  const { userId, page = 1, limit = 20, isChatMessage, isForumPost } = options;
  const forumId = options.forumId.trim();
  if (!forumId) return { ok: false, status: 400, error: "Missing forum id" };

  try {
    const viewer = await prisma.user.findUnique({
      where: { id: userId },
      select: { universityId: true },
    });
    if (!viewer?.universityId) return { ok: false, status: 400, error: "Set your university in profile first" };

    const forum = await prisma.forum.findUnique({
      where: { id: forumId },
      select: { type: true, universityId: true },
    });
    if (!forum) return { ok: false, status: 404, error: "Forum not found" };
    if (forum.universityId !== viewer.universityId) return { ok: false, status: 403, error: "Forbidden" };
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
        where: {
          forumId,
          universityId: viewer.universityId,
          isChatMessage,
          isForumPost,
          OR: [
            { audience: "UNIVERSITY" },
            {
              audience: "FOLLOWERS",
              OR: [
                { authorId: userId },
                { author: { followers: { some: { followerId: userId } } } },
              ],
            },
          ],
          AND: [
            {
              OR: [
                { isPinned: true },
                { expiresAt: { gt: new Date() } },
                { expiresAt: null }
              ]
            }
          ]
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          author: {
            select: {
              id: true,
              name: true,
              image: true,
              handle: true,
              rank: { select: { label: true, badge: true } },
            },
          },
          _count: { select: { likes: true, comments: true } },
        },
      }) as unknown as PostRow[]);
    } catch (inner) {
      console.error("[forum-posts] full query failed, retrying without rank", inner);
      try {
        posts = (await prisma.post.findMany({
          where: {
            forumId,
            universityId: viewer.universityId,
            OR: [
              { audience: "UNIVERSITY" },
              {
                audience: "FOLLOWERS",
                OR: [
                  { authorId: userId },
                  { author: { followers: { some: { followerId: userId } } } },
                ],
              },
            ],
          },
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
          include: {
            author: {
              select: { id: true, name: true, image: true, handle: true },
            },
            _count: { select: { likes: true, comments: true } },
          },
        }) as unknown as PostRow[]);
      } catch (inner2) {
        console.error("[forum-posts] retry without rank failed, retrying without _count", inner2);
        const bare = await prisma.post.findMany({
          where: {
            forumId,
            universityId: viewer.universityId,
            OR: [
              { audience: "UNIVERSITY" },
              {
                audience: "FOLLOWERS",
                OR: [
                  { authorId: userId },
                  { author: { followers: { some: { followerId: userId } } } },
                ],
              },
            ],
          },
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
          include: {
            author: { select: { id: true, name: true, image: true, handle: true } },
          },
        });
        posts = (bare.map((p) => ({
          ...p,
          _count: { likes: 0, comments: 0 },
        })) as unknown as PostRow[]);
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

    // Affinity Algorithm: Sort by User Interaction (Likes given to author)
    const authorIds = [...new Set(posts.map(p => p.authorId))];
    const affinityData = authorIds.length > 0 ? await Promise.all(authorIds.map(async aid => {
      const count = await prisma.like.count({
        where: { userId, post: { authorId: aid } }
      });
      return { authorId: aid, score: count };
    })) : [];
    const affinityMap = new Map(affinityData.map(d => [d.authorId, d.score]));

    const formatted: ForumPostJson[] = posts.map((p) => ({
      id: p.id,
      content: p.content,
      imageUrl: p.imageUrl,
      attachments: (p as any).attachments, // Explicitly pass attachments field
      interactionsDisabled: p.interactionsDisabled,
      authorId: p.authorId,
      forumId: p.forumId,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
      expiresAt: p.expiresAt ? p.expiresAt.toISOString() : null,
      isPinned: p.isPinned,
      author: {
        id: p.author.id,
        name: p.author.name,
        image: p.author.image,
        handle: p.author.handle,
        ...(p.author.rank ? { rank: p.author.rank } : {}),
      },
      _count: p._count,
      likedByMe: likedSet.has(p.id),
    }));

    // Perform final sort: Pinned > Affinity > Date
    formatted.sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      const scoreA = affinityMap.get(a.authorId) || 0;
      const scoreB = affinityMap.get(b.authorId) || 0;
      if (scoreA !== scoreB) return scoreB - scoreA;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return { ok: true, posts: formatted };
  } catch (e) {
    console.error("[forum-posts]", e);
    const message = e instanceof Error ? e.message : String(e);
    const code = e instanceof Prisma.PrismaClientKnownRequestError ? e.code : undefined;
    return { ok: false, status: 500, error: "Failed to load posts", details: message, code };
  }
}
