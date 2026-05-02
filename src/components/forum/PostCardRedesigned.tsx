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
import { motion, AnimatePresence } from "framer-motion";

type ReactType = 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry' | null;

interface Props {
  post: any; // We'll use the type from ForumPostJson
  currentUserId?: string;
  isInitialPinned?: boolean;
}

export function PostCardRedesigned({ post, currentUserId }: Props) {
  const [likeCount, setLikeCount] = useState(post._count?.likes ?? 0);
  const [liking, setLiking] = useState(false);
  const [showComments, setShowComments] = useState(false);
  
  const [activeReaction, setActiveReaction] = useState<ReactType>(post.likedByMe ? 'like' : null);
  const [showReacts, setShowReacts] = useState(false);
  const reactTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const initials = post.author.name
    ? post.author.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
    : "??";

  const getReactionIcon = (r: ReactType) => {
    switch (r) {
      case 'love': return <Heart className="h-5 w-5 fill-red-500 text-red-500" />;
      case 'haha': return <span className="text-xl">😆</span>;
      case 'wow': return <span className="text-xl">🔥</span>;
      case 'sad': return <span className="text-xl">💡</span>;
      case 'angry': return <span className="text-xl">🎯</span>;
      default: return <Heart className="h-5 w-5 fill-primary text-primary" />;
    }
  };

  const handleReact = async (type: ReactType) => {
    if (!currentUserId) return toast.error("Sign in to like");
    if (reactTimeoutRef.current) clearTimeout(reactTimeoutRef.current);
    setShowReacts(false);

    if (activeReaction === type) type = null;

    setLiking(true);
    const wasLiked = activeReaction !== null;
    const isLiked = type !== null;

    const prevReaction = activeReaction;
    setActiveReaction(type);
    
    if (wasLiked !== isLiked) {
       setLikeCount((c: number) => c + (isLiked ? 1 : -1));
    }

    try {
      await fetch(`/api/v1/posts/${post.id}/like`, { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type })
      });
    } catch {
      setActiveReaction(prevReaction);
      if (wasLiked !== isLiked) {
         setLikeCount((c: number) => c + (isLiked ? -1 : 1));
      }
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
    <article className="group mb-4 rounded-[24px] dark:bg-[#131220] bg-white border dark:border-white/[0.05] border-black/5 overflow-hidden shadow-sm hover:shadow-md transition-all">
      {/* Header */}
      <div className="flex items-start justify-between px-5 pt-5 pb-3">
        <div className="flex items-center gap-4">
          <Link href={`/profile/u/${post.author.id}`} className="shrink-0">
            <div className="h-12 w-12 flex items-center justify-center rounded-full dark:bg-white/5 bg-slate-100 overflow-hidden border dark:border-white/10 border-slate-200">
               <img 
                 src={post.author.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(post.author.name || "User")}&backgroundColor=c0aede,d1d4f9,b6e3f4`}
                 alt={post.author.name}
                 className="h-full w-full object-cover"
               />
            </div>
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Link href={`/profile/u/${post.author.id}`} className="font-bold text-[15px] dark:text-white text-slate-900 hover:text-primary transition-colors truncate">
                {post.author.name}
              </Link>
              {(post.author.handle || post.author.nickname) && (
                <span className="dark:text-white/40 text-slate-500 text-[13px] font-medium">@{post.author.handle || post.author.nickname}</span>
              )}
            </div>
            <p className="text-[12px] dark:text-white/30 text-slate-400 font-bold uppercase tracking-wider mt-0.5">
              {formatDistanceToNow(new Date(post.createdAt))}
            </p>
          </div>
        </div>

        {badge && (
          <div className={cn(
            "flex items-center gap-1 px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-widest",
            badge.color
          )}>
            {badge.icon && <Pin className="h-3 w-3 fill-current" />}
            {badge.label}
          </div>
        )}
      </div>

      {/* Body */}
      <div className="px-5 py-2">
        <div className="prose dark:prose-invert prose-sm max-w-none dark:text-white/80 text-slate-700 leading-relaxed font-medium">
          <ReactMarkdown components={markdownComponentsWithImages}>
            {enhancePlainImageUrls(post.content)}
          </ReactMarkdown>
        </div>
        
        {post.imageUrl && (
          <div className="mt-4 relative aspect-[16/9] rounded-[20px] border dark:border-white/10 border-black/5 overflow-hidden dark:bg-black/20 bg-slate-50 shadow-inner">
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
      <div className="px-3 py-3 mt-2 flex items-center justify-between border-t dark:border-white/[0.05] border-black/5 dark:bg-black/20 bg-slate-50/50">
         <div className="flex items-center gap-2 w-full relative">
            
            {/* Reaction Popover */}
            <AnimatePresence>
               {showReacts && (
                  <motion.div 
                     initial={{ opacity: 0, y: 10, scale: 0.95 }}
                     animate={{ opacity: 1, y: 0, scale: 1 }}
                     exit={{ opacity: 0, y: 10, scale: 0.95 }}
                     className="absolute bottom-full left-0 mb-3 bg-white dark:bg-[#1f1d36] rounded-full shadow-2xl border dark:border-white/10 border-black/5 px-2 py-1.5 flex items-center gap-1 z-50"
                     onMouseEnter={() => {
                        if (reactTimeoutRef.current) clearTimeout(reactTimeoutRef.current);
                        setShowReacts(true);
                     }}
                     onMouseLeave={() => setShowReacts(false)}
                  >
                     {[
                        { type: 'like', icon: <Heart className="h-5 w-5 fill-primary text-primary" />, label: 'Like' },
                        { type: 'love', icon: <Heart className="h-5 w-5 fill-red-500 text-red-500" />, label: 'Love' },
                        { type: 'haha', icon: <span className="text-xl">😆</span>, label: 'Haha' },
                        { type: 'wow', icon: <span className="text-xl">🔥</span>, label: 'Fire' },
                        { type: 'sad', icon: <span className="text-xl">💡</span>, label: 'Smart' },
                        { type: 'angry', icon: <span className="text-xl">🎯</span>, label: 'Target' }
                     ].map(react => (
                        <button
                           key={react.type}
                           onClick={(e) => {
                              e.stopPropagation();
                              handleReact(react.type as ReactType);
                           }}
                           className="relative group/btn hover:-translate-y-2 hover:scale-125 transition-all duration-300 p-2.5 rounded-full hover:bg-white/10"
                        >
                           {react.icon}
                           <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black/80 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                              {react.label}
                           </span>
                        </button>
                     ))}
                  </motion.div>
               )}
            </AnimatePresence>

            <button 
               onClick={() => handleReact(activeReaction ? null : 'like')}
               onMouseEnter={() => {
                  if (reactTimeoutRef.current) clearTimeout(reactTimeoutRef.current);
                  setShowReacts(true);
               }}
               onMouseLeave={() => {
                  reactTimeoutRef.current = setTimeout(() => setShowReacts(false), 300);
               }}
               disabled={liking}
               className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-[13px] transition-all",
                  activeReaction === 'love' ? "text-red-500 dark:bg-red-500/10 bg-red-50" : 
                  activeReaction ? "text-blue-500 dark:bg-blue-500/10 bg-blue-50" : 
                  "dark:text-white/50 text-slate-500 hover:bg-black/5 dark:hover:bg-white/5"
               )}
            >
               {activeReaction === 'love' ? <Heart className="h-4 w-4 fill-current" /> :
                activeReaction === 'like' ? <Heart className="h-4 w-4 fill-current" /> :
                activeReaction ? <span className="text-base leading-none">{getReactionIcon(activeReaction)}</span> :
                <Heart className="h-4 w-4" />}
               <span>{activeReaction ? activeReaction.charAt(0).toUpperCase() + activeReaction.slice(1) : "Like"} {likeCount > 0 ? `(${likeCount})` : ''}</span>
            </button>

            <button 
               onClick={() => setShowComments(!showComments)}
               className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-[13px] dark:text-white/50 text-slate-500 hover:bg-black/5 dark:hover:bg-white/5 transition-all"
            >
               <MessageSquare className="h-4 w-4" />
               <span>{post._count?.comments || 0}</span>
            </button>

            <button 
               onClick={handleShare}
               className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-[13px] dark:text-white/50 text-slate-500 hover:bg-black/5 dark:hover:bg-white/5 transition-all"
            >
               <Share2 className="h-4 w-4" />
               <span className="hidden sm:inline">Share</span>
            </button>
         </div>
      </div>

      {/* Comments section */}
      {showComments && (
        <div className="px-5 pb-5 border-t dark:border-white/[0.05] border-black/5">
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

