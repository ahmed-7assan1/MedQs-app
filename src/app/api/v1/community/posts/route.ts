import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { loadForumPostsForUser } from "@/lib/forum-posts";
import type { ForumPostJson } from "@/lib/forum-posts";
import { unstable_cache } from "next/cache";

export const runtime = "nodejs";

const getCachedCommunityPosts = unstable_cache(
  async (userId: string): Promise<ForumPostJson[]> => {
    const forum = await prisma.forum.findFirst({
      where: { type: "GLOBAL" },
      select: { id: true },
    });
    if (!forum) return [];

    const result = await loadForumPostsForUser({
      forumId: forum.id,
      userId,
      page: 1,
      limit: 6,
    });

    if (!result.ok) return [];
    return result.posts;
  },
  ["community-posts"],
  { revalidate: 30, tags: ["community"] }
);

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const posts = await getCachedCommunityPosts(session.user.id);
    return NextResponse.json({ items: posts, total: posts.length, page: 1, hasMore: false });
  } catch (error) {
    console.error("Community Posts Error:", error);
    return NextResponse.json({ error: "Failed to fetch community posts" }, { status: 500 });
  }
}
