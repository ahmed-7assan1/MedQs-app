import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { PostCard } from "@/components/forum/PostCard";
import { StudentPageShell } from "@/components/layout/StudentPageShell";
import type { PostWithMeta } from "@/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Params = { postId: string };

export default async function ForumSinglePostPage({
  params,
}: {
  params: Params | Promise<Params>;
}) {
  const { postId } = await Promise.resolve(params);
  const id = String(postId ?? "").trim();
  if (!id) notFound();

  const session = await auth();
  const meId = session?.user?.id;

  const row = await prisma.post
    .findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
            rank: { select: { label: true, badge: true } },
          },
        },
        forum: { select: { name: true, type: true } },
        _count: { select: { likes: true, comments: true } },
      },
    })
    .catch(() => null);

  if (!row) notFound();

  if (row.forum?.type === "PRIVATE") {
    if (!meId) notFound();
    const member = await prisma.privateForumMember.findUnique({
      where: { forumId_userId: { forumId: row.forumId, userId: meId } },
      select: { id: true },
    });
    if (!member) notFound();
  }

  let likedByMe = false;
  if (meId) {
    const like = await prisma.like.findUnique({
      where: { userId_postId: { postId: id, userId: meId } },
      select: { id: true },
    });
    likedByMe = !!like;
  }

  const post: PostWithMeta = {
    id: row.id,
    content: row.content,
    imageUrl: row.imageUrl ?? undefined,
    interactionsDisabled: row.interactionsDisabled,
    createdAt: row.createdAt.toISOString(),
    author: {
      id: row.author.id,
      name: row.author.name,
      image: row.author.image ?? undefined,
      rank: row.author.rank
        ? { label: row.author.rank.label, badge: row.author.rank.badge ?? undefined }
        : undefined,
    },
    _count: row._count,
    likedByMe,
  };

  return (
    <StudentPageShell
      maxWidthClass="max-w-2xl"
      eyebrow="Forum"
      title="Post"
      subtitle={row.forum?.name ?? undefined}
    >
      <div className="mb-4">
        <Link href="/forum" className="text-sm text-primary hover:underline">
          ← Back to forum
        </Link>
      </div>
      <PostCard post={post} currentUserId={meId} forumName={row.forum?.name ?? null} />
    </StudentPageShell>
  );
}
