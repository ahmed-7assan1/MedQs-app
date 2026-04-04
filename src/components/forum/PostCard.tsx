"use client";
import { useState } from "react";
import { Heart, Share2, MoreHorizontal, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PostWithMeta } from "@/types";
import { formatDistanceToNow } from "@/lib/utils";
import { CommentThread } from "./CommentThread";
import toast from "react-hot-toast";
import ReactMarkdown from "react-markdown";

interface Props {
  post: PostWithMeta;
  currentUserId?: string;
}

const RANK_COLORS: Record<string, string> = {
  Newbie:       "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  Active:       "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  Contributor:  "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  Expert:       "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  Elite:        "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

export function PostCard({ post, currentUserId }: Props) {
  const [liked, setLiked]       = useState(post.likedByMe ?? false);
  const [likeCount, setLikeCount] = useState(post._count.likes);
  const [liking, setLiking]     = useState(false);

  async function handleLike() {
    if (!currentUserId) return toast.error("Sign in to like posts");
    if (post.interactionsDisabled) return;
    setLiking(true);
    const next = !liked;
    setLiked(next);
    setLikeCount((c) => c + (next ? 1 : -1));
    try {
      await fetch(`/api/v1/posts/${post.id}/like`, { method: "POST" });
    } catch {
      setLiked(!next);
      setLikeCount((c) => c + (next ? -1 : 1));
    } finally {
      setLiking(false);
    }
  }

  async function handleShare() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/forum/post/${post.id}`);
      toast.success("Link copied!");
      await fetch(`/api/v1/posts/${post.id}/share`, { method: "POST" });
    } catch {
      toast.error("Could not copy link");
    }
  }

  const rankLabel = post.author.rank?.label ?? "Newbie";
  const rankColor = RANK_COLORS[rankLabel] ?? RANK_COLORS.Newbie;

  return (
    <article className="overflow-hidden rounded-xl border border-border bg-card transition-all duration-200 hover:border-border/80">
      {/* Author */}
      <div className="flex items-start justify-between px-5 pt-5 pb-3">
        <div className="flex items-center gap-2.5">
          {post.author.image ? (
            <img src={post.author.image} alt={post.author.name} className="h-9 w-9 rounded-full object-cover" />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
              {post.author.name[0]?.toUpperCase()}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold">{post.author.name}</p>
              <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-semibold", rankColor)}>
                {post.author.rank?.badge ?? ""} {rankLabel}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(post.createdAt))}
            </p>
          </div>
        </div>
        <button className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted transition-colors">
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>

      {/* Content */}
      <div className="px-5 pb-4">
        <div className="prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed">
          <ReactMarkdown>{post.content}</ReactMarkdown>
        </div>
        {post.imageUrl && (
          <img src={post.imageUrl} alt="" className="mt-3 w-full rounded-lg object-cover max-h-80" />
        )}
      </div>

      {/* Interactions disabled */}
      {post.interactionsDisabled && (
        <div className="mx-5 mb-3 flex items-center gap-1.5 rounded-lg bg-muted px-3 py-1.5 text-xs text-muted-foreground">
          <Lock className="h-3 w-3" />
          Interactions disabled by author
        </div>
      )}

      {/* Like + Share bar */}
      <div className="flex items-center gap-1 border-t border-border px-5 py-2.5">
        <button
          onClick={handleLike}
          disabled={liking || post.interactionsDisabled}
          className={cn(
            "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
            liked
              ? "text-red-500 bg-red-50 dark:bg-red-900/20"
              : "text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
          )}
        >
          <Heart className={cn("h-4 w-4", liked && "fill-current")} />
          {likeCount}
        </button>

        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <Share2 className="h-4 w-4" />
          Share
        </button>
      </div>

      {/* Comment thread — only if interactions not disabled */}
      {!post.interactionsDisabled && (
        <CommentThread
          postId={post.id}
          currentUserId={currentUserId}
          initialCount={post._count.comments}
        />
      )}
    </article>
  );
}
