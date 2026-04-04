"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { enhancePlainImageUrls, normalizeImageUrl } from "@/lib/markdown-helpers";
import { markdownComponentsWithImages } from "@/components/ui/MarkdownBody";
import toast from "react-hot-toast";

type Item = {
  id: string;
  content: string;
  imageUrl?: string | null;
  createdAt: string;
  forum?: { name: string } | null;
};

export function UserPosts({ posts, isOwn }: { posts: Item[]; isOwn: boolean }) {
  const [list, setList] = useState(posts);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function removePost(postId: string) {
    setDeleting(postId);
    try {
      const res = await fetch(`/api/v1/posts/${postId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setList((prev) => prev.filter((p) => p.id !== postId));
      toast.success("Post deleted");
    } catch {
      toast.error("Could not delete post");
    } finally {
      setDeleting(null);
    }
  }

  if (list.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
        No forum posts yet.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {list.map((post) => (
        <div key={post.id} className="rounded-xl border border-border bg-card p-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {post.forum?.name ? `${post.forum.name} · ` : ""}
              {new Date(post.createdAt).toLocaleString()}
            </p>
            {isOwn && (
              <button
                disabled={deleting === post.id}
                onClick={() => removePost(post.id)}
                className="rounded-md border border-border px-2 py-1 text-xs text-red-500 hover:bg-red-500/10 disabled:opacity-60"
              >
                {deleting === post.id ? "Deleting..." : "Delete"}
              </button>
            )}
          </div>
          {post.content?.trim() ? (
            <div className="prose prose-sm dark:prose-invert max-w-none prose-img:my-3">
              <ReactMarkdown components={markdownComponentsWithImages}>
                {enhancePlainImageUrls(post.content)}
              </ReactMarkdown>
            </div>
          ) : null}
          {post.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={normalizeImageUrl(post.imageUrl)}
              alt=""
              className={`max-h-72 w-full rounded-lg border border-border bg-muted/20 object-contain ${post.content?.trim() ? "mt-3" : ""}`}
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          ) : null}
          {!post.content?.trim() && !post.imageUrl ? (
            <p className="text-sm italic text-muted-foreground">Empty post</p>
          ) : null}
        </div>
      ))}
    </div>
  );
}
