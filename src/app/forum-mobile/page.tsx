import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSessionScope } from "@/lib/tenant";
import { redirect } from "next/navigation";
import { MobileForumFeed } from "@/components/forum/MobileForumFeed";

export const dynamic = "force-dynamic";

export default async function MobileForumPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const scope = await getSessionScope(session);
  if (!scope || !scope.universityId) {
    redirect("/profile?error=university_required");
  }

  // Fetch initial posts for the university feed
  const posts = await prisma.post.findMany({
    where: {
      universityId: scope.universityId,
      isForumPost: true,
      NOT: { forum: { status: "CLOSED" } }
    },
    orderBy: { createdAt: "desc" },
    take: 20,
    include: {
      author: {
        select: {
          id: true,
          name: true,
          image: true,
          rank: { select: { label: true, badge: true } }
        }
      },
      university: { select: { name: true } },
      _count: { select: { likes: true, comments: true } }
    }
  });

  // Check if current user liked these posts
  const postIds = posts.map(p => p.id);
  const myLikes = await prisma.postLike.findMany({
    where: {
      userId: session.user.id,
      postId: { in: postIds }
    },
    select: { postId: true }
  });

  const likedPostIds = new Set(myLikes.map(l => l.postId));
  const processedPosts = posts.map(p => ({
    ...p,
    likedByMe: likedPostIds.has(p.id)
  }));

  return (
    <div className="min-h-screen bg-black">
      <MobileForumFeed 
        initialPosts={processedPosts as any} 
        currentUserId={session.user.id} 
      />
    </div>
  );
}
