import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ForumClient } from "@/components/forum/ForumClient";
import { loadForumPostsForUser } from "@/lib/forum-posts";
import type { PostWithMeta } from "@/types";

export default async function ForumPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { semesterId: true },
  });

  const forums = await prisma.forum.findMany({
    where: {
      OR: [
        { type: "GLOBAL" },
        { type: "SEMESTER", semesterId: user?.semesterId ?? undefined },
        { type: "PRIVATE", members: { some: { userId: session.user.id } } },
      ],
      NOT: { status: "CLOSED" },
    },
    orderBy: { createdAt: "asc" },
    include: {
      _count: { select: { posts: true } },
    },
  });

  const first = forums[0];
  let initialForumId: string | null = null;
  let initialPosts: PostWithMeta[] = [];
  if (first) {
    initialForumId = first.id;
    const loaded = await loadForumPostsForUser({
      forumId: first.id,
      userId: session.user.id,
      page: 1,
      limit: 20,
    });
    if (loaded.ok) initialPosts = loaded.posts as PostWithMeta[];
  }

  return (
    <ForumClient
      forums={forums as any}
      currentUserId={session.user.id}
      initialForumId={initialForumId}
      initialPosts={initialPosts}
    />
  );
}
