import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { loadForumPostsForUser } from "@/lib/forum-posts";
import type { ForumPostJson } from "@/lib/forum-posts";
import { unstable_cache } from "next/cache";
import { CACHE_TAGS, CACHE_TTL } from "@/lib/cache-tags";
import { apiSuccess, apiError, apiUnauthorized } from "@/lib/api-response";
import { createLogger } from "@/lib/logger";

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
  { revalidate: CACHE_TTL.COMMUNITY, tags: [CACHE_TAGS.COMMUNITY] }
);

const log = createLogger("community-posts");

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return apiUnauthorized();
  }

  try {
    const posts = await getCachedCommunityPosts(session.user.id);
    return apiSuccess({ items: posts, total: posts.length, page: 1, hasMore: false });
  } catch (error) {
    log.error("Failed to fetch community posts", { error: error instanceof Error ? error.message : String(error) });
    return apiError(500, "Internal Server Error", "Failed to fetch community posts");
  }
}
