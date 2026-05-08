"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { 
  Heart, 
  ChatCircle, 
  ShareNetwork, 
  DotsThreeOutline, 
  PushPin, 
  Lock, 
  Trash, 
  CaretLeft, 
  CaretRight, 
  XCircle,
  PaperPlaneTilt,
  CheckCircle
} from "@phosphor-icons/react";
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
    if (typeof url !== 'string') return url;
    if (url.includes("localhost:3000")) {
      return url.split("localhost:3000")[1]; // Make it relative
    }
    return url;
  };

  // Smart merge of legacy imageUrl and new attachments array
  const attachments = (() => {
    let list: any[] = [];
    let rawAttachments = post.attachments;

    // Handle stringified JSON from database
    if (typeof rawAttachments === 'string') {
      try {
        rawAttachments = JSON.parse(rawAttachments);
      } catch (e) {
        rawAttachments = [];
      }
    }

    if (Array.isArray(rawAttachments)) {
      list = rawAttachments.map((a: any) => ({ ...a, url: sanitizeUrl(a.url) }));
    } else if (rawAttachments && typeof rawAttachments === 'object') {
      list = Object.values(rawAttachments).map((a: any) => ({ ...a, url: sanitizeUrl(a.url) }));
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
      case 'love': return <Heart size={24} weight="fill" className="text-red-500" />;
      case 'haha': return <span className="text-xl animate-bounce">😆</span>;
      case 'wow': return <span className="text-xl animate-pulse">🔥</span>;
      case 'sad': return <span className="text-xl">💡</span>;
      case 'angry': return <span className="text-xl rotate-12">🎯</span>;
      default: return <Heart size={24} weight="fill" className="text-primary" />;
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
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-4 sm:mb-8 bg-[#161523]/60 backdrop-blur-xl border-y sm:border border-white/[0.05] sm:rounded-[32px] overflow-hidden shadow-2xl"
    >
      {/* Header: Compact on Mobile */}
      <div className="flex items-center justify-between p-3 sm:p-5">
        <div className="flex items-center gap-3">
          <Link href={`/profile/u/${post.author.id}`} className="relative h-10 w-10 sm:h-12 sm:w-12 flex items-center justify-center rounded-full bg-gradient-to-br from-[#534AB7] to-[#AFA9EC] p-[2px]">
             <div className="h-full w-full rounded-full bg-[#161523] p-[1px] overflow-hidden">
               <img 
                 src={post.author.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(post.author.name || "User")}`} 
                 className="h-full w-full rounded-full object-cover" 
                 alt="" 
               />
             </div>
             <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 bg-emerald-500 rounded-full border-2 border-[#161523]" />
          </Link>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <Link href={`/profile/u/${post.author.id}`} className="text-sm sm:text-[15px] font-black text-white hover:text-[#AFA9EC] transition-colors tracking-tight">
                {post.author.name}
              </Link>
              {post.author.rank && (
                <span className="px-1.5 py-0.5 rounded-md bg-[#534AB7]/20 text-[#AFA9EC] text-[8px] font-black uppercase tracking-widest border border-[#534AB7]/30">
                  {post.author.rank.label}
                </span>
              )}
              {post.isPinned && <PushPin size={16} weight="fill" className="text-[#AFA9EC]" />}
            </div>
            <div className="flex items-center gap-1.5 text-[9px] font-bold text-white/30 uppercase tracking-widest">
              <span>{formatDistanceToNow(new Date(post.createdAt))} ago</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-1 relative">
          {badge && (
            <div className={cn(
              "hidden sm:block px-2 py-1 rounded-lg border text-[8px] font-black uppercase tracking-wider",
              badge.color
            )}>
              {badge.label}
            </div>
          )}
          <button 
            onClick={() => setShowOptions(!showOptions)}
            className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-white/5 text-white/40 hover:text-white transition-all"
          >
            <DotsThreeOutline size={20} weight="fill" />
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
                      <Trash size={18} weight="bold" />
                      Delete Asset
                    </button>
                  )}
                  <button 
                    onClick={() => { setShowOptions(false); handleShare(); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-white/40 hover:bg-white/5 transition-all text-xs font-black uppercase tracking-widest"
                  >
                    <ShareNetwork size={18} weight="bold" />
                    Copy Signal
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Media: Edge-to-Edge on Mobile */}
      <div className="relative">
        <PostGallery attachments={attachments} />
      </div>

      {/* Action Bar: Instagram Style */}
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-5">
            <div className="relative group/react">
              <button 
                onClick={() => handleReact('like')}
                onContextMenu={(e) => { e.preventDefault(); setShowReacts(true); }}
                className={cn(
                  "transition-all active:scale-125",
                  activeReaction ? "text-red-500" : "text-white hover:text-white/70"
                )}
              >
                {activeReaction ? (
                  activeReaction === 'like' ? <Heart size={28} weight="fill" className="text-red-500" /> : getReactionIcon(activeReaction)
                ) : (
                  <Heart size={28} weight="bold" />
                )}
              </button>
              
              <AnimatePresence>
                {showReacts && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10, scale: 0.9 }}
                    animate={{ opacity: 1, y: -20, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.9 }}
                    className="absolute bottom-full mb-4 left-0 bg-[#161523] border border-white/10 rounded-2xl p-2 flex gap-2 shadow-2xl z-50 backdrop-blur-xl"
                  >
                    {(['like', 'love', 'haha', 'wow', 'sad', 'angry'] as ReactType[]).map((r) => (
                      <button
                        key={r}
                        onClick={() => handleReact(r)}
                        className="h-10 w-10 flex items-center justify-center hover:bg-white/10 rounded-xl transition-all hover:scale-125"
                      >
                        {getReactionIcon(r)}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button 
              onClick={() => setShowComments(!showComments)}
              className="text-white hover:text-white/70 transition-all active:scale-125"
            >
              <ChatCircle size={28} weight="bold" />
            </button>
            
            <button 
              onClick={handleShare}
              className="text-white hover:text-white/70 transition-all active:scale-125"
            >
              <ShareNetwork size={28} weight="bold" />
            </button>
          </div>
          
          <button className="text-white hover:text-white/70 transition-all active:scale-125">
             <PushPin size={28} weight="bold" />
          </button>
        </div>

        {/* Engagements Count */}
        <div className="text-[13px] font-black text-white mb-2 tracking-tight">
          {likeCount.toLocaleString()} Engagements
        </div>

        {/* Content (Caption) */}
        <div className="text-sm leading-relaxed text-white/90 font-medium">
          <span className="font-black mr-2 text-[14px]">{post.author.name}</span>
          <div className="inline prose prose-invert prose-sm max-w-none">
            <ReactMarkdown components={markdownComponentsWithImages}>
              {enhancePlainImageUrls(post.content)}
            </ReactMarkdown>
          </div>
        </div>

        {/* Comments Link */}
        {!showComments && post._count?.comments > 0 && (
          <button 
            onClick={() => setShowComments(true)}
            className="mt-2 block text-[13px] font-bold text-white/30 hover:text-white/50 transition-colors"
          >
            View all {post._count.comments} comments
          </button>
        )}
      </div>

      {/* Nested Comments */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-white/[0.05] bg-black/10"
          >
            <CommentThread 
              postId={post.id} 
              currentUserId={currentUserId} 
              initialCount={post._count?.comments ?? 0}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Purge Publication?"
        message="This will permanently remove this data stream from the forum grid."
        confirmText={deleting ? "Purging..." : "Confirm Purge"}
        variant="danger"
      />
    </motion.div>
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

