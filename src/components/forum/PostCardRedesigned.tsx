"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Heart, MessageSquare, Share2, MoreHorizontal, Pin, Lock, Loader2, Send, Trash2, ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn, formatDistanceToNow } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import { enhancePlainImageUrls, normalizeImageUrl } from "@/lib/markdown-helpers";
import { markdownComponentsWithImages } from "@/components/ui/MarkdownBody";
import { CommentThread } from "./CommentThread";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { PostGallery } from "./PostGallery";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

type ReactType = 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry' | null;

interface Props {
  post: any;
  currentUserId?: string;
  currentUserRole?: string;
  currentUserUniversityId?: string;
  isInitialPinned?: boolean;
}

export function PostCardRedesigned({ post, currentUserId, currentUserRole, currentUserUniversityId }: Props) {
  const [likeCount, setLikeCount] = useState(post._count?.likes ?? 0);
  const [liking, setLiking] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const [activeReaction, setActiveReaction] = useState<ReactType>(post.likedByMe ? 'like' : null);
  const [showReacts, setShowReacts] = useState(false);
  const reactTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  if (isDeleted) return null;

  const initials = post.author.name
    ? post.author.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
    : "??";

  // Helper to fix legacy localhost URLs stored in DB
  const sanitizeUrl = (url: string) => {
    if (!url) return url;
    if (url.includes("localhost:3000")) {
      return url.split("localhost:3000")[1]; // Make it relative
    }
    return url;
  };

  // Smart merge of legacy imageUrl and new attachments array
  const attachments = (() => {
    let list: any[] = [];
    if (Array.isArray(post.attachments)) {
      list = post.attachments.map((a: any) => ({ ...a, url: sanitizeUrl(a.url) }));
    } else if (post.attachments && typeof post.attachments === 'object') {
      list = Object.values(post.attachments).map((a: any) => ({ ...a, url: sanitizeUrl(a.url) }));
    }

    const imgUrl = sanitizeUrl(post.imageUrl);
    // If we have a legacy imageUrl that isn't in the attachments list, add it
    if (imgUrl && !list.some(a => a.url === imgUrl)) {
      list.unshift({ url: imgUrl, type: 'image' });
    }
    return list;
  })();

  const canDelete = post.authorId === currentUserId || 
                    currentUserRole === "SUPER_ADMIN" || 
                    (currentUserRole === "ADMIN" && currentUserUniversityId === post.universityId);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/v1/posts/${post.id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Post deleted");
        setIsDeleted(true);
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to delete");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const getReactionIcon = (r: ReactType) => {
    switch (r) {
      case 'love': return <Heart className="h-5 w-5 fill-red-500 text-red-500" />;
      case 'haha': return <span className="text-xl animate-bounce">😆</span>;
      case 'wow': return <span className="text-xl animate-pulse">🔥</span>;
      case 'sad': return <span className="text-xl">💡</span>;
      case 'angry': return <span className="text-xl rotate-12">🎯</span>;
      default: return <Heart className="h-5 w-5 fill-primary text-primary shadow-lg shadow-primary/20" />;
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
      toast.success("Connection link copied to clipboard!");
    } catch {
      toast.error("Handshake failed — could not copy link");
    }
  };

  const badge = getExpiryBadge(post.expiresAt, post.isPinned);

  return (
    <article className="group relative mb-6 rounded-[32px] bg-[#161523]/40 border border-white/[0.03] overflow-hidden backdrop-blur-xl hover:bg-[#161523]/60 transition-all duration-500 shadow-2xl">
      {/* Decorative Glow */}
      <div className="absolute -top-24 -right-24 h-48 w-48 bg-primary/5 blur-[100px] rounded-full pointer-events-none" />
      
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-6 pb-4">
        <div className="flex items-center gap-4">
          <Link href={`/profile/u/${post.author.id}`} className="shrink-0 relative group/avatar">
            <div className="h-14 w-14 flex items-center justify-center rounded-2xl bg-gradient-to-br from-white/10 to-white/[0.02] overflow-hidden border border-white/10 shadow-xl transition-all duration-300 group-hover/avatar:scale-105 group-hover/avatar:rotate-3">
               <img 
                 src={post.author.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(post.author.name || "User")}&backgroundColor=c0aede,d1d4f9,b6e3f4`}
                 alt={post.author.name}
                 className="h-full w-full object-cover"
               />
            </div>
            <div className="absolute -bottom-1 -right-1 h-5 w-5 bg-emerald-500 rounded-full border-4 border-[#161523] shadow-lg" title="Active Transceiver" />
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Link href={`/profile/u/${post.author.id}`} className="font-black text-[16px] text-white hover:text-primary transition-all tracking-tight leading-none">
                {post.author.name}
              </Link>
              {post.author.rank?.badge && (
                <span className="px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-500 text-[9px] font-black uppercase tracking-widest border border-amber-500/20">
                  {post.author.rank.label}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1.5">
              <p className="text-[10px] text-white/20 font-black uppercase tracking-widest">
                {formatDistanceToNow(new Date(post.createdAt))}
              </p>
              <span className="h-1 w-1 rounded-full bg-white/10" />
              <span className="text-[10px] text-primary font-black uppercase tracking-widest">Secure Link</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 relative">
          {badge && (
            <div className={cn(
              "px-3 py-1.5 rounded-xl border text-[9px] font-black uppercase tracking-[0.2em] shadow-sm backdrop-blur-md",
              badge.color
            )}>
              {badge.label}
            </div>
          )}
          
          <button 
            onClick={() => setShowOptions(!showOptions)}
            className="p-2.5 rounded-xl bg-white/[0.02] text-white/20 hover:text-white hover:bg-white/5 transition-all"
          >
            <MoreHorizontal className="h-5 w-5" />
          </button>

          <AnimatePresence>
            {showOptions && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowOptions(false)} />
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -10 }}
                  className="absolute right-0 top-full mt-2 w-48 bg-[#1f1d36] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden"
                >
                  {canDelete && (
                    <button 
                      onClick={() => { setShowOptions(false); setShowDeleteConfirm(true); }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 transition-all text-xs font-black uppercase tracking-widest"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete Asset
                    </button>
                  )}
                  <button 
                    onClick={() => { setShowOptions(false); handleShare(); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-white/40 hover:bg-white/5 transition-all text-xs font-black uppercase tracking-widest"
                  >
                    <Share2 className="h-4 w-4" />
                    Copy Signal
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Body */}
      <div className="px-6 pb-6">
        <div className="prose dark:prose-invert prose-sm max-w-none text-white/70 leading-relaxed font-medium mb-5">
          <ReactMarkdown components={markdownComponentsWithImages}>
            {enhancePlainImageUrls(post.content)}
          </ReactMarkdown>
        </div>
        
        <PostGallery attachments={attachments} />
      </div>

      {/* Metrics Row */}
      <div className="px-6 py-3 flex items-center justify-between border-y border-white/[0.02] bg-black/10">
         <div className="flex items-center gap-4">
            <div className="flex -space-x-2">
               {[1,2,3].map(i => (
                 <div key={i} className="h-6 w-6 rounded-full border-2 border-[#161523] bg-primary/20 flex items-center justify-center overflow-hidden">
                    <div className="h-full w-full bg-primary/40 animate-pulse" />
                 </div>
               ))}
            </div>
            <p className="text-[11px] font-bold text-white/40">
              <span className="text-white">{likeCount}</span> Engagements
            </p>
         </div>
         <p className="text-[11px] font-bold text-white/40 hover:text-white/60 cursor-pointer transition-colors" onClick={() => setShowComments(!showComments)}>
           {post._count?.comments || 0} Comments
         </p>
      </div>

      {/* Actions */}
      <div className="px-4 py-3 flex items-center justify-between gap-2">
         <div className="flex-1 flex items-center gap-2 relative">
            <AnimatePresence>
               {showReacts && (
                  <motion.div 
                     initial={{ opacity: 0, y: 10, scale: 0.95 }}
                     animate={{ opacity: 1, y: 0, scale: 1 }}
                     exit={{ opacity: 0, y: 10, scale: 0.95 }}
                     className="absolute bottom-full left-0 mb-4 bg-[#1f1d36]/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 p-2 flex items-center gap-1 z-50 ring-1 ring-white/5"
                  >
                     {[
                        { type: 'like', icon: <Heart className="h-6 w-6 fill-primary text-primary" /> },
                        { type: 'love', icon: <Heart className="h-6 w-6 fill-red-500 text-red-500" /> },
                        { type: 'haha', icon: <span className="text-2xl">😆</span> },
                        { type: 'wow', icon: <span className="text-2xl">🔥</span> },
                        { type: 'sad', icon: <span className="text-2xl">💡</span> },
                        { type: 'angry', icon: <span className="text-2xl">🎯</span> }
                     ].map(react => (
                        <button
                           key={react.type}
                           onClick={(e) => { e.stopPropagation(); handleReact(react.type as ReactType); }}
                           className="p-3 rounded-xl hover:bg-white/5 transition-all active:scale-90"
                        >
                           {react.icon}
                        </button>
                     ))}
                  </motion.div>
               )}
            </AnimatePresence>

            <button 
               onClick={() => handleReact(activeReaction ? null : 'like')}
               onContextMenu={(e) => { e.preventDefault(); setShowReacts(true); }}
               disabled={liking}
               className={cn(
                  "flex-1 flex items-center justify-center gap-2.5 py-3.5 rounded-[18px] font-black text-[11px] uppercase tracking-widest transition-all active:scale-95",
                  activeReaction ? "text-primary bg-primary/10 border border-primary/20 shadow-lg shadow-primary/10" : "text-white/30 hover:bg-white/5 border border-transparent"
               )}
            >
               {activeReaction ? getReactionIcon(activeReaction) : <Heart className="h-5 w-5" />}
               <span>{activeReaction ? "Reaction Active" : "Interact"}</span>
            </button>

            <button 
               onClick={() => setShowComments(!showComments)}
               className="flex-1 flex items-center justify-center gap-2.5 py-3.5 rounded-[18px] font-black text-[11px] uppercase tracking-widest text-white/30 hover:bg-white/5 transition-all active:scale-95"
            >
               <MessageSquare className="h-5 w-5" />
               <span>Broadcast</span>
            </button>

            <button 
               onClick={handleShare}
               className="flex items-center justify-center p-4 rounded-[18px] text-white/30 hover:bg-white/5 hover:text-white transition-all active:scale-95"
            >
               <Share2 className="h-5 w-5" />
            </button>
         </div>
      </div>

      {/* Comments section */}
      {showComments && (
        <div className="px-6 pb-6 border-t border-white/[0.02] bg-black/10 animate-in slide-in-from-top-4 duration-500">
          <CommentThread 
            postId={post.id} 
            currentUserId={currentUserId}
            initialCount={post._count?.comments ?? 0}
            variant="default"
          />
        </div>
      )}

      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        isLoading={deleting}
        title="Destroy Record?"
        message="This action will permanently purge this data from the forum grid. This cannot be undone."
        confirmText="Confirm Purge"
        cancelText="Abort"
        variant="danger"
      />
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

