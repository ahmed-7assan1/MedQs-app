import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSessionScope } from "@/lib/tenant";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await auth();
  const scope = await getSessionScope(session);
  if (!scope) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!scope.universityId) return NextResponse.json({ error: "Set your university in profile first" }, { status: 400 });

  const { searchParams } = new URL(req.url);
  const forumId = String(searchParams.get("forumId") ?? "").trim();
  const mode = (searchParams.get("mode") ?? "university").toLowerCase();
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(50, Math.max(5, Number(searchParams.get("limit") ?? 20)));
  const skip = (page - 1) * limit;

  if (!forumId) return NextResponse.json({ error: "forumId required" }, { status: 400 });
  const forum = await prisma.forum.findUnique({ where: { id: forumId }, select: { universityId: true, status: true } });
  if (!forum) return NextResponse.json({ error: "Forum not found" }, { status: 404 });
  if (forum.universityId !== scope.universityId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let followingIds: string[] | null = null;
  if (mode === "following") {
    const rows = await prisma.userFollow.findMany({
      where: { followerId: scope.userId },
      select: { followingId: true },
    });
    followingIds = Array.from(new Set([scope.userId, ...rows.map((r) => r.followingId)]));
  }

  const blockedIds = await prisma.blockedUser.findMany({
    where: { userId: scope.userId },
    select: { blockedId: true },
  });
  const blockedSet = new Set(blockedIds.map(b => b.blockedId));

  const posts = await prisma.post.findMany({
    where: {
      forumId,
      universityId: scope.universityId,
      // isForumPost: true, // Removed due to temporary type mismatch
      ...(followingIds ? { authorId: { in: followingIds } } : {}),
      authorId: blockedSet.size > 0 ? { notIn: [...blockedSet] } : undefined,
      OR: [
        { audience: "UNIVERSITY" },
        {
          audience: "FOLLOWERS",
          OR: [
            { authorId: scope.userId },
            { author: { followers: { some: { followerId: scope.userId } } } },
          ],
        },
      ],
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
          rank: { select: { label: true, badge: true } },
        },
      },
      _count: { select: { likes: true, comments: true } },
      reactions: { select: { type: true, userId: true } },
    },
  });

  const postIds = posts.map((p) => p.id);
  const likedRows =
    postIds.length === 0
      ? []
      : await prisma.like.findMany({ where: { userId: scope.userId, postId: { in: postIds } }, select: { postId: true } });
  const likedSet = new Set(likedRows.map((r) => r.postId));

  return NextResponse.json(
    posts.map((p) => ({
      id: p.id,
      content: p.content,
      imageUrl: p.imageUrl,
      interactionsDisabled: p.interactionsDisabled,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
      authorId: p.authorId,
      forumId: p.forumId,
      isAnonymous: (p as any).isAnonymous,
      backgroundStyle: (p as any).backgroundStyle,
      author: (p as any).isAnonymous ? {
        id: p.authorId,
        name: "عضو مجهول",
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=anonymous"
      } : (p as any).author,
      _count: (p as any)._count,
      likedByMe: likedSet.has(p.id),
      reactions: (p as any).reactions || [],
    })),
    {
      headers: {
        // Serve stale data for 30s, revalidate in background for 60s.
        // Firebase WebSockets will push any new posts in real-time.
        "Cache-Control": "s-maxage=30, stale-while-revalidate=60",
      },
    }
  );
}

