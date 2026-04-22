"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Heart, MessageSquare, Share2, MoreHorizontal, Pin, Lock } from "lucide-react";
import { cn, formatDistanceToNow } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import { enhancePlainImageUrls, normalizeImageUrl } from "@/lib/markdown-helpers";
import { markdownComponentsWithImages } from "@/components/ui/MarkdownBody";
import { CommentThread } from "./CommentThread";
import toast from "react-hot-toast";

interface Props {
  post: any; // We'll use the type from ForumPostJson
  currentUserId?: string;
  isInitialPinned?: boolean;
}

export function PostCardRedesigned({ post, currentUserId }: Props) {
  const [liked, setLiked] = useState(post.likedByMe ?? false);
  const [likeCount, setLikeCount] = useState(post._count?.likes ?? 0);
  const [liking, setLiking] = useState(false);
  const [showComments, setShowComments] = useState(false);

  const initials = post.author.name
    ? post.author.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
    : "??";

  const handleLike = async () => {
    if (!currentUserId) return toast.error("Sign in to like");
    setLiking(true);
    const next = !liked;
    setLiked(next);
    setLikeCount((c: number) => c + (next ? 1 : -1));
    try {
      await fetch(`/api/v1/posts/${post.id}/like`, { method: "POST" });
    } catch {
      setLiked(!next);
      setLikeCount((c: number) => c + (next ? -1 : 1));
    } finally {
      setLiking(false);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/forum/post/${post.id}`);
      toast.success("Link copied!");
    } catch {
      toast.error("Could not copy link");
    }
  };

  const badge = getExpiryBadge(post.expiresAt, post.isPinned);

  return (
    <article className="group mb-4 bg-white/[0.04] border-b border-white/[0.02] last:border-0 overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-3">
          <Link href={`/profile/u/${post.author.id}`} className="shrink-0">
            <div className="h-10 w-10 flex items-center justify-center rounded-full bg-[#534AB7]/20 border border-[#534AB7]/30 text-[#AFA9EC] font-medium text-sm">
              {initials}
            </div>
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Link href={`/profile/u/${post.author.id}`} className="font-medium text-[15px] hover:text-[#AFA9EC] transition-colors truncate">
                {post.author.name}
              </Link>
              {post.author.handle && (
                <span className="text-white/40 text-[13px]">@{post.author.handle}</span>
              )}
            </div>
            <p className="text-[12px] text-white/30 uppercase tracking-tight">
              {formatDistanceToNow(new Date(post.createdAt))}
            </p>
          </div>
        </div>

        {badge && (
          <div className={cn(
            "flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-medium uppercase tracking-wider",
            badge.color
          )}>
            {badge.icon && <Pin className="h-2.5 w-2.5 fill-current" />}
            {badge.label}
          </div>
        )}
      </div>

      {/* Body */}
      <div className="px-4 py-2">
        <div className="prose prose-invert prose-sm max-w-none text-white/90 leading-relaxed font-normal">
          <ReactMarkdown components={markdownComponentsWithImages}>
            {enhancePlainImageUrls(post.content)}
          </ReactMarkdown>
        </div>
        
        {post.imageUrl && (
          <div className="mt-3 relative aspect-[16/9] rounded-xl border border-white/[0.02] overflow-hidden bg-white/[0.02]">
            <img 
              src={normalizeImageUrl(post.imageUrl)} 
              className="w-full h-full object-cover" 
              alt=""
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-4 py-3 flex items-center gap-4 text-[13px] text-white/40 font-medium select-none">
        <button 
          onClick={handleLike}
          disabled={liking}
          className={cn(
            "flex items-center gap-1.5 transition-colors hover:text-white",
            liked && "text-[#534AB7]"
          )}
        >
          <Heart className={cn("h-4 w-4", liked && "fill-current")} />
          <span>{likeCount}</span>
        </button>

        <span className="opacity-20 cursor-default">·</span>

        <button 
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1.5 transition-colors hover:text-white"
        >
          <MessageSquare className="h-4 w-4" />
          <span>{post._count?.comments || 0}</span>
        </button>

        <span className="opacity-20 cursor-default">·</span>

        <button 
          onClick={handleShare}
          className="flex items-center gap-1.5 transition-colors hover:text-white"
        >
          <Share2 className="h-4 w-4" />
          <span>Share</span>
        </button>

        <div className="ml-auto">
          <button className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-white/5 transition-colors">
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Comments section */}
      {showComments && (
        <div className="px-4 pb-4 border-t border-white/[0.02]">
          <CommentThread 
            postId={post.id} 
            currentUserId={currentUserId}
            initialCount={post._count?.comments ?? 0}
            variant="default"
          />
        </div>
      )}
    </article>
  );
}

function getExpiryBadge(expiresAt: string | null, isPinned: boolean) {
  if (isPinned) return { label: "Pinned", color: "bg-amber-500/10 text-amber-500 border-amber-500/20", icon: true };
  if (!expiresAt) return null;
  const target = new Date(expiresAt).getTime();
  const now = Date.now();
  const diffHours = (target - now) / (1000 * 60 * 60);
  const diffDays = Math.ceil(diffHours / 24);

  if (diffHours <= 0) return { label: "expired", color: "bg-red-500/10 text-red-500 border-red-500/20" };
  if (diffHours <= 24) return { label: "expires today", color: "bg-red-500/10 text-red-500 border-red-500/20" };
  if (diffDays <= 1) return { label: "expires tomorrow", color: "bg-orange-500/10 text-orange-500 border-orange-500/20" };
  if (diffDays <= 2) return { label: "expires in 2d", color: "bg-orange-500/10 text-orange-500 border-orange-500/20" };
  if (diffDays <= 6) return { label: `expires in ${diffDays}d`, color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" };
  return { label: `expires in ${diffDays}d`, color: "bg-green-500/10 text-green-500 border-green-500/20" };
}

