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
      <div className="rounded-2xl border border-transparent bg-white/[0.02] py-12 text-center text-[13px] font-medium text-white/30">
        No forum posts yet.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {list.map((post) => (
        <div key={post.id} className="rounded-2xl border border-white/[0.02] bg-white/[0.02] p-5 transition-all hover:bg-white/[0.04]">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[12px] uppercase tracking-wider text-white/30 font-semibold">
              {post.forum?.name ? `${post.forum.name} · ` : ""}
              {new Date(post.createdAt).toLocaleDateString()}
            </p>
            {isOwn && (
              <button
                disabled={deleting === post.id}
                onClick={() => removePost(post.id)}
                className="rounded-lg bg-red-500/10 px-3 py-1.5 text-[11px] font-medium text-red-500 hover:bg-red-500/20 disabled:opacity-60 transition-colors"
              >
                {deleting === post.id ? "Deleting..." : "Delete Post"}
              </button>
            )}
          </div>
          {post.content?.trim() ? (
          <div dir="auto" className="prose prose-sm prose-invert max-w-none text-white/90 prose-img:my-3">
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
              className={`max-h-72 w-full rounded-xl border border-white/[0.02] bg-white/[0.02] object-contain ${post.content?.trim() ? "mt-4" : ""}`}
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

