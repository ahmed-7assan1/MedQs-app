"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Heart, Share2, MoreHorizontal, Lock, Bookmark, BookmarkCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PostWithMeta } from "@/types";
import { formatDistanceToNow } from "@/lib/utils";
import { CommentThread } from "./CommentThread";
import toast from "react-hot-toast";
import ReactMarkdown from "react-markdown";
import { enhancePlainImageUrls, normalizeImageUrl } from "@/lib/markdown-helpers";
import { markdownComponentsWithImages } from "@/components/ui/MarkdownBody";
import {
  isPostSaved,
  removeSavedPost,
  savePostSnapshot,
} from "@/lib/forum-saved-posts";
import { ForumAuthorAvatar } from "./ForumAuthorAvatar";

interface Props {
  post: PostWithMeta;
  currentUserId?: string;
  /** Current forum name (for saved-posts snapshot). */
  forumName?: string | null;
  /** Thread-style bubbles for Discussions (chat) tab. */
  variant?: "card" | "chat";
}

const RANK_COLORS: Record<string, string> = {
  Newbie:       "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  Active:       "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  Contributor:  "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  Expert:       "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  Elite:        "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

export function PostCard({ post, currentUserId, forumName, variant = "card" }: Props) {
  const [liked, setLiked]       = useState(post.likedByMe ?? false);
  const [likeCount, setLikeCount] = useState(post._count?.likes ?? 0);
  const [liking, setLiking]     = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [savedLocal, setSavedLocal] = useState(() => isPostSaved(post.id));
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSavedLocal(isPostSaved(post.id));
  }, [post.id]);

  useEffect(() => {
    if (!menuOpen) return;
    function onDoc(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [menuOpen]);

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

  function toggleSave() {
    if (!currentUserId) {
      toast.error("Sign in to save posts");
      return;
    }
    if (savedLocal) {
      removeSavedPost(post.id);
      setSavedLocal(false);
      toast.success("Removed from saved");
    } else {
      savePostSnapshot({
        id: post.id,
        content: post.content,
        imageUrl: post.imageUrl ?? null,
        createdAt: post.createdAt,
        authorId: post.author.id,
        authorName: post.author.name,
        forumName: forumName ?? null,
      });
      setSavedLocal(true);
      toast.success("Saved to your profile");
    }
    setMenuOpen(false);
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
  const isOwn = Boolean(currentUserId && post.author.id === currentUserId);

  if (variant === "chat") {
    return (
      <div className={cn("flex w-full gap-2", isOwn ? "flex-row-reverse" : "flex-row")}>
        {post.author.image ? (
          <ForumAuthorAvatar src={post.author.image} alt={post.author.name} sizePx={32} className="h-8 w-8 shrink-0 mt-0.5" />
        ) : (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
            {post.author.name[0]?.toUpperCase()}
          </div>
        )}
        <div className={cn("min-w-0 max-w-[min(85%,28rem)]", isOwn && "text-right")}>
          <div className={cn("flex flex-wrap items-center gap-1.5 px-0.5", isOwn && "justify-end")}>
            <Link href={`/profile/u/${post.author.id}`} className="text-xs font-semibold hover:underline">
              {post.author.name}
            </Link>
            <span className="text-[10px] text-muted-foreground">{formatDistanceToNow(new Date(post.createdAt))}</span>
          </div>
          <article
            className={cn(
              "mt-1 rounded-2xl border px-3.5 py-2.5 text-left shadow-sm",
              isOwn
                ? "border-primary/25 bg-primary text-primary-foreground"
                : "border-white/[0.02] bg-muted/60 dark:bg-muted/25"
            )}
          >
            <div
              className={cn(
                "prose prose-sm max-w-none text-sm leading-relaxed prose-p:my-1 prose-headings:my-2 prose-img:my-2 prose-img:rounded-lg",
                isOwn ? "prose-invert" : "dark:prose-invert"
              )}
            >
              <ReactMarkdown components={markdownComponentsWithImages}>
                {enhancePlainImageUrls(post.content)}
              </ReactMarkdown>
            </div>
            {post.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={normalizeImageUrl(post.imageUrl)}
                alt=""
                className="mt-2 max-h-56 w-full rounded-xl border border-white/[0.03] object-contain"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
            ) : null}
            {post.interactionsDisabled && (
              <p className="mt-2 flex items-center gap-1 text-[10px] opacity-80">
                <Lock className="h-3 w-3" /> Replies locked
              </p>
            )}
            <div className={cn("mt-2 flex flex-wrap items-center gap-2 border-t pt-2", isOwn ? "border-white/[0.02]" : "border-white/[0.02]")}>
              <button
                type="button"
                onClick={handleLike}
                disabled={liking || post.interactionsDisabled}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium transition-colors",
                  liked
                    ? isOwn
                      ? "bg-white/20 text-white"
                      : "text-red-500"
                    : isOwn
                      ? "text-primary-foreground/90 hover:bg-white/15"
                      : "text-muted-foreground hover:text-red-500"
                )}
              >
                <Heart className={cn("h-3.5 w-3.5", liked && "fill-current")} />
                {likeCount > 0 ? likeCount : null}
              </button>
              <button
                type="button"
                onClick={handleShare}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium transition-colors",
                  isOwn ? "text-primary-foreground/90 hover:bg-white/15" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Share2 className="h-3.5 w-3.5" />
                Share
              </button>
              <div className={cn("relative", isOwn && "ml-auto")} ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setMenuOpen((o) => !o)}
                  className={cn(
                    "rounded-full p-1 transition-colors",
                    isOwn ? "hover:bg-white/15" : "hover:bg-muted"
                  )}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
                {menuOpen ? (
                  <div
                    role="menu"
                    className={cn(
                      "absolute z-50 mt-1 min-w-[160px] rounded-xl border border-white/[0.03] bg-card py-1 shadow-lg",
                      isOwn ? "left-0" : "right-0"
                    )}
                  >
                    <button
                      type="button"
                      role="menuitem"
                      onClick={toggleSave}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
                    >
                      {savedLocal ? <BookmarkCheck className="h-4 w-4 text-primary" /> : <Bookmark className="h-4 w-4" />}
                      {savedLocal ? "Unsave" : "Save"}
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </article>
          {!post.interactionsDisabled && (
            <CommentThread
              postId={post.id}
              currentUserId={currentUserId}
              initialCount={post._count?.comments ?? 0}
              variant="chat"
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <article className="overflow-hidden rounded-xl border border-white/[0.02] bg-card transition-all duration-200 hover:border-white/[0.03]">
      {/* Author */}
      <div className="flex items-start justify-between px-5 pt-5 pb-3">
        <div className="flex items-center gap-2.5">
          {post.author.image ? (
            <ForumAuthorAvatar src={post.author.image} alt={post.author.name} sizePx={36} className="h-9 w-9" />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
              {post.author.name[0]?.toUpperCase()}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <Link
                href={`/profile/u/${post.author.id}`}
                className="text-sm font-semibold hover:text-primary hover:underline"
              >
                {post.author.name}
              </Link>
              <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-semibold", rankColor)}>
                {post.author.rank?.badge ?? ""} {rankLabel}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(post.createdAt))}
            </p>
          </div>
        </div>
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            onClick={() => setMenuOpen((o) => !o)}
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
          {menuOpen ? (
            <div
              role="menu"
              className="absolute right-0 top-full z-50 mt-1 min-w-[180px] rounded-xl border border-white/[0.03] bg-card py-1 shadow-lg"
            >
              <button
                type="button"
                role="menuitem"
                onClick={toggleSave}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
              >
                {savedLocal ? (
                  <BookmarkCheck className="h-4 w-4 text-primary" />
                ) : (
                  <Bookmark className="h-4 w-4" />
                )}
                {savedLocal ? "Unsave post" : "Save post"}
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {/* Content */}
      <div className="px-5 pb-4">
        <div className="prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed prose-img:my-3">
          <ReactMarkdown components={markdownComponentsWithImages}>
            {enhancePlainImageUrls(post.content)}
          </ReactMarkdown>
        </div>
        {post.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={normalizeImageUrl(post.imageUrl)}
            alt=""
            className="mt-3 max-h-80 w-full rounded-lg border border-white/[0.02] bg-muted/20 object-contain"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        ) : null}
      </div>

      {/* Interactions disabled */}
      {post.interactionsDisabled && (
        <div className="mx-5 mb-3 flex items-center gap-1.5 rounded-lg bg-muted px-3 py-1.5 text-xs text-muted-foreground">
          <Lock className="h-3 w-3" />
          Interactions disabled by author
        </div>
      )}

      {/* Like + Share bar */}
      <div className="flex items-center gap-1 border-t border-white/[0.02] px-5 py-2.5">
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
          initialCount={post._count?.comments ?? 0}
          variant="default"
        />
      )}
    </article>
  );
}


