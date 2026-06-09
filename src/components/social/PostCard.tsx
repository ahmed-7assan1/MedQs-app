"use client";

import Link from "next/link";
import { ProfessionalVideoPlayer } from "@/components/ui/ProfessionalVideoPlayer";
import {
  Heart,
  ChatCircle,
  BookmarkSimple,
  ShareNetwork,
  Trash,
  PencilSimple,
  CircleNotch,
  Flag,
  Prohibit,
  PushPin,
  DotsThreeOutline,
  FileText,
  ShieldCheck,
  ChartBar,
  Pause,
  Play,
  X,
  ArrowLeft,
  ArrowRight
} from "@phosphor-icons/react";
import React, { useState, useRef, useMemo } from "react";
import { cn, formatDistanceToNow } from "@/lib/utils";
import { PostDetailModal } from "@/components/forum/PostDetailModal";

const REACTION_MAP: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  LIKE: { icon: <Heart size={18} weight="fill" />, label: "Like", color: "text-red-500" },
};

function renderContentAndMentions(text: string) {
  if (!text) return "";
  const parts = text.split(/(#[a-zA-Z0-9_\u0600-\u06FF]+|@[a-zA-Z0-9_\u0600-\u06FF]+)/g);
  return parts.map((part, i) => {
    if (part.startsWith("#")) {
      return <span key={i} className="text-[#534AB7] font-bold">{part}</span>;
    }
    if (part.startsWith("@")) {
      return (
        <span key={i} className="text-primary font-black hover:underline cursor-pointer">
          {part}
        </span>
      );
    }
    return part;
  });
}
import ReactMarkdown from "react-markdown";
import { enhancePlainImageUrls } from "@/lib/markdown-helpers";
import { markdownComponentsWithImages } from "@/components/ui/MarkdownBody";
import { CommentSection } from "./CommentSection";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { ReportModal } from "./ReportModal";

interface Props {
  post: any;
  currentUserId?: string;
  currentUserRole?: string;
  currentUserUniversityId?: string;
  isRoomPost?: boolean;
}

const PostCardInner = ({
  post,
  currentUserId,
  currentUserRole,
  currentUserUniversityId,
  isRoomPost
}: Props) => {
  const [isLiked, setIsLiked] = useState(post.likedByMe ?? false);
  const [likeCount, setLikeCount] = useState(post._count?.likes ?? 0);
  const [liking, setLiking] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [selectedQaIdx, setSelectedQaIdx] = useState<number | null>(null);

  const [reactions, setReactions] = useState<{ type: string; userId: string }[]>(post.reactions || []);
  const [showReactionPicker, setShowReactionPicker] = useState(false);

  const [showReactionDetail, setShowReactionDetail] = useState(false);
  const [reactionUsers, setReactionUsers] = useState<{ type: string; user: { name: string; image?: string } }[]>([]);
  const [loadingReactions, setLoadingReactions] = useState(false);

  const [showReportModal, setShowReportModal] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content || "");
  const [savingEdit, setSavingEdit] = useState(false);
  const [postContent, setPostContent] = useState(post.content || "");
  const isEdited = post.updatedAt ? new Date(post.updatedAt).getTime() - new Date(post.createdAt).getTime() > 2000 : false;
  const [editedState, setEditedState] = useState(isEdited);
  const [showPostModal, setShowPostModal] = useState(false);

  const myReaction = currentUserId ? reactions.find((r) => r.userId === currentUserId)?.type : null;
  const reactionCounts = reactions.reduce((acc: Record<string, number>, r) => {
    acc[r.type] = (acc[r.type] || 0) + 1;
    return acc;
  }, {});

  const handleReact = async (type: string | null) => {
    if (!currentUserId) return toast.error("Sign in to react");
    setShowReactionPicker(false);

    const prevReactions = [...reactions];
    if (!type) {
      setReactions(prevReactions.filter((r) => r.userId !== currentUserId));
    } else {
      const idx = prevReactions.findIndex((r) => r.userId === currentUserId);
      if (idx !== -1) {
        const updated = [...prevReactions];
        updated[idx] = { ...updated[idx], type };
        setReactions(updated);
      } else {
        setReactions([...prevReactions, { type, userId: currentUserId }]);
      }
    }

    try {
      const res = await fetch(`/api/v1/posts/${post.id}/reactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      if (!res.ok) {
        setReactions(prevReactions);
      }
    } catch {
      setReactions(prevReactions);
    }
  };

  const handleLikeClick = () => {
    const coarsePointer =
      typeof window !== "undefined" &&
      window.matchMedia("(hover: none) and (pointer: coarse)").matches;

    if (coarsePointer && !myReaction) {
      setShowReactionPicker((open) => !open);
      return;
    }

    if (myReaction) {
      handleReact(null);
    } else {
      handleReact("LIKE");
    }
  };

  const handleSaveEdit = async () => {
    if (!editContent.trim()) return;
    setSavingEdit(true);
    try {
      const res = await fetch(`/api/v1/posts/${post.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editContent }),
      });
      if (res.ok) {
        setPostContent(editContent);
        setEditedState(true);
        setIsEditing(false);
        toast.success("Post updated successfully");
      } else {
        toast.error("Failed to update post");
      }
    } catch {
      toast.error("Failed to update post");
    } finally {
      setSavingEdit(false);
    }
  };

  const avatarUrl = post.author?.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(post.author?.name || "user")}`;

  const attachments = (() => {
    if (Array.isArray(post.attachments)) return post.attachments;
    if (typeof post.attachments === "string") {
      try { return JSON.parse(post.attachments); } catch { return []; }
    }
    return [];
  })();

  const allImages = attachments.filter((a: any) => a.type === 'image');
  const allAudios = attachments.filter((a: any) => a.type === 'audio' || a.type === 'telegram_audio');
  const allVideos = attachments.filter((a: any) => 
    a.type === 'video' || 
    a.type === 'telegram_video' ||
    (typeof a.url === 'string' && (
      a.url.toLowerCase().split('?')[0].endsWith('.mp4') ||
      a.url.toLowerCase().split('?')[0].endsWith('.mov') ||
      a.url.toLowerCase().split('?')[0].endsWith('.webm') ||
      a.url.includes('t.me/') ||
      a.url.includes('/api/v1/telegram/')
    ))
  );
  const allFiles = attachments.filter((a: any) => 
    a.type !== 'image' && 
    a.type !== 'audio' && 
    a.type !== 'telegram_audio' &&
    !allVideos.some((v: any) => v.url === a.url)
  );

  const inlineTelegramVideo = useMemo(() => {
    if (attachments.length > 0) return null;
    if (!postContent) return null;
    const match = postContent.match(/https?:\/\/(?:www\.)?(?:t\.me|telegram\.me)\/([a-zA-Z0-9_]+)\/(\d+)/i);
    return match ? match[0] : null;
  }, [postContent, attachments]);

  if (isDeleted) return null;

  const canDelete =
    post.authorId === currentUserId ||
    currentUserRole === "SUPER_ADMIN" ||
    (!isRoomPost && currentUserRole === "ADMIN" && currentUserUniversityId === post.universityId);

  const isClassName = (style: string) => {
    if (!style) return true;
    return !style.startsWith("data:") && !style.startsWith("http") && !style.startsWith("url(") && !style.startsWith("/");
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleLike = async () => {
    if (!currentUserId) return toast.error("Sign in to like");
    setLiking(true);
    const prev = isLiked;
    setIsLiked(!isLiked);
    setLikeCount((c: number) => c + (isLiked ? -1 : 1));
    try {
      const endpoint = isRoomPost ? `/api/v1/rooms/${post.roomId}/posts/${post.id}/like` : `/api/v1/posts/${post.id}/like`;
      await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: isLiked ? null : "like" }),
      });
    } catch {
      setIsLiked(prev);
      setLikeCount((c: number) => c + (isLiked ? 1 : -1));
    } finally { setLiking(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const endpoint = isRoomPost ? `/api/v1/rooms/${post.roomId}/posts/${post.id}` : `/api/v1/posts/${post.id}`;
      const res = await fetch(endpoint, { method: "DELETE" });
      if (res.ok) {
        toast.success("Post deleted");
        setIsDeleted(true);
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to delete");
      }
    } catch { toast.error("Network error"); }
    finally { setDeleting(false); setShowDeleteConfirm(false); }
  };

  const handleShare = async () => {
    try {
      const url = isRoomPost ? `${window.location.origin}/rooms/${post.roomId}` : `${window.location.origin}/social?post=${post.id}`;
      await navigator.clipboard.writeText(url);
      toast.success("Link copied!");
    } catch { toast.error("Could not copy link"); }
  };

  const handleBlockUser = async () => {
    try {
      const res = await fetch("/api/v1/block", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blockedId: post.authorId }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.blocked ? "User blocked" : "User unblocked");
        setShowBlockConfirm(false);
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed");
      }
    } catch { toast.error("Network error"); }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 16 }} 
      whileInView={{ opacity: 1, y: 0 }} 
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.4, ease: "easeOut" }} 
      onClick={(e) => {
        const target = e.target as HTMLElement;
        if (!target.closest("button, a, textarea, input, [role=\"button\"], [role=\"menuitem\"]")) {
          setShowPostModal(true);
        }
      }}
      className="rounded-2xl sm:rounded-[32px] bg-white dark:bg-[#161523] border border-slate-200/80 dark:border-white/[0.08] overflow-hidden shadow-xl hover:border-primary/20 dark:hover:border-primary/20 transition-all duration-300 transform-gpu cursor-pointer" 
    >
      
      {/* Header */}
      <div className="flex items-center gap-3 sm:gap-4 p-4 sm:p-5 pb-0">
        {post.isAnonymous ? (
          <div className="relative flex-shrink-0">
            <img src={avatarUrl} alt="" className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl object-cover border border-slate-200 dark:border-white/10 shadow-sm" />
          </div>
        ) : (
          <Link href={`/profile/u/${post.author?.id}`} className="relative flex-shrink-0">
            <img src={avatarUrl} alt="" className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl object-cover border border-slate-200 dark:border-white/10 shadow-sm" />
            <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 sm:h-3.5 sm:w-3.5 bg-emerald-500 rounded-full border-2 border-white dark:border-[#161523]" />
          </Link>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
            {post.isAnonymous ? (
              <span className="text-sm sm:text-[15px] font-black text-slate-800 dark:text-white leading-tight">{post.author?.name}</span>
            ) : (
              <Link href={`/profile/u/${post.author?.id}`} className="text-sm sm:text-[15px] font-black text-slate-800 dark:text-white hover:text-primary transition-colors leading-tight">{post.author?.name}</Link>
            )}
            {post.author?.rank && (
              <span className="px-1.5 py-0.5 rounded-md bg-primary/10 text-primary text-[8px] font-black uppercase tracking-widest border border-primary/10">
                {post.author.rank.label}
              </span>
            )}
            {post.isPinned && <PushPin size={14} weight="fill" className="text-amber-400" />}
          </div>
          <p className="text-[10px] sm:text-[11px] text-slate-400 dark:text-white/20 font-bold uppercase tracking-widest mt-0.5">
            {formatDistanceToNow(new Date(post.createdAt))} ago{editedState && " • Edited"}
          </p>
        </div>
        <div className="relative">
          <button onClick={() => setShowOptions(!showOptions)} className="h-8 w-8 sm:h-10 sm:w-10 flex items-center justify-center rounded-xl sm:rounded-2xl text-slate-400 dark:text-white/20 hover:text-primary hover:bg-primary/5 transition-all">
            <DotsThreeOutline className="w-[18px] h-[18px] sm:w-[20px] sm:h-[20px]" weight="fill" />
          </button>
          <AnimatePresence>
            {showOptions && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowOptions(false)} />
                <motion.div initial={{ opacity: 0, scale: 0.95, y: -8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: -8 }} className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-[#1f1e36] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden py-1.5">
                  <button onClick={() => { setShowOptions(false); handleShare(); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-slate-500 dark:text-white/50 hover:bg-primary/5 hover:text-primary transition-all text-[13px] font-bold"><ShareNetwork size={18} weight="bold" /> Copy link</button>
                  {post.authorId === currentUserId && (
                    <button onClick={() => { setShowOptions(false); setIsEditing(true); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-slate-500 dark:text-white/50 hover:bg-primary/5 hover:text-primary transition-all text-[13px] font-bold"><PencilSimple size={18} weight="bold" /> Edit post</button>
                  )}
                  {canDelete && <button onClick={() => { setShowOptions(false); setShowDeleteConfirm(true); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-red-500 hover:bg-red-500/10 transition-all text-[13px] font-bold"><Trash size={18} weight="bold" /> Delete post</button>}
                  {post.authorId !== currentUserId && (
                    <>
                      <button onClick={() => { setShowOptions(false); setShowReportModal(true); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-amber-500 hover:bg-amber-500/10 transition-all text-[13px] font-bold"><Flag size={18} weight="bold" /> Report post</button>
                      <button onClick={() => { setShowOptions(false); setShowBlockConfirm(true); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-red-500 hover:bg-red-500/10 transition-all text-[13px] font-bold"><Prohibit size={18} weight="bold" /> Block @{post.author?.name}</button>
                    </>
                  )}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Content */}
      {(() => {
        const postComponents = {
          ...markdownComponentsWithImages,
          p: ({ children, ...props }: any) => {
            if (typeof children === "string") {
              return <p {...props}>{renderContentAndMentions(children)}</p>;
            }
            if (Array.isArray(children)) {
              return (
                <p {...props}>
                  {children.map((child, idx) =>
                    typeof child === "string" ? renderContentAndMentions(child) : child
                  )}
                </p>
              );
            }
            return <p {...props}>{children}</p>;
          },
        };

        if (isEditing) {
          return (
            <div className="px-4 sm:px-6 py-3.5 sm:py-4 space-y-3">
              <div 
                className={cn(
                  "relative rounded-2xl transition-all duration-300 overflow-hidden",
                  post.backgroundStyle ? "shadow-lg border border-slate-200/50 dark:border-white/10 min-h-[180px] flex items-center justify-center p-4 sm:p-6" : "",
                  post.backgroundStyle && (isClassName(post.backgroundStyle) ? post.backgroundStyle : "bg-cover bg-center")
                )}
                style={post.backgroundStyle && !isClassName(post.backgroundStyle) ? { backgroundImage: `url("${post.backgroundStyle}")` } : undefined}
              >
                {/* Tint Overlay for Images to ensure readable text */}
                {post.backgroundStyle && (!isClassName(post.backgroundStyle) || post.backgroundStyle.includes("url")) && (
                  <div className="absolute inset-0 bg-black/45 z-0" />
                )}
                <textarea dir="auto"
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className={cn(
                    "w-full bg-transparent border-none p-0 focus:ring-0 resize-none z-10",
                    post.backgroundStyle 
                      ? "text-white placeholder:text-white/60 text-xl font-extrabold text-center leading-normal" 
                      : "w-full min-h-[120px] bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-3 text-slate-900 dark:text-white text-[14px] focus:outline-none focus:border-primary resize-none"
                  )}
                  style={{ minHeight: post.backgroundStyle ? "100px" : "120px" }}
                  placeholder="What's on your mind?"
                />
              </div>
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-200 dark:bg-white/5 hover:bg-slate-300 dark:hover:bg-white/10 text-slate-700 dark:text-white/60 text-[12px] font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={savingEdit || !editContent.trim()}
                  className="px-3.5 py-1.5 rounded-lg bg-primary hover:bg-primary/80 text-white text-[12px] font-bold transition-all disabled:opacity-50"
                >
                  {savingEdit ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          );
        }

        return postContent?.trim() ? (
          <div 
            className={cn(
              "px-4 sm:px-6 pt-3 sm:pt-4 pb-1 text-sm sm:text-[15px] leading-relaxed text-slate-700 dark:text-white/85 font-medium", 
              post.backgroundStyle && `m-2 sm:m-4 rounded-xl sm:rounded-[24px] p-5 sm:p-8 text-center text-base sm:text-xl font-extrabold flex items-center justify-center min-h-[120px] sm:min-h-[160px] text-white shadow-lg relative overflow-hidden`,
              post.backgroundStyle && (isClassName(post.backgroundStyle) ? post.backgroundStyle : "bg-cover bg-center")
            )}
            style={post.backgroundStyle && !isClassName(post.backgroundStyle) ? { backgroundImage: `url("${post.backgroundStyle}")` } : undefined}
          >
            {/* Tint Overlay for Images to ensure readable text */}
            {post.backgroundStyle && (!isClassName(post.backgroundStyle) || post.backgroundStyle.includes("url")) && (
              <div className="absolute inset-0 bg-black/45 z-0" />
            )}
            
            <div dir="auto" className={cn("prose prose-slate dark:prose-invert prose-sm max-w-none prose-p:my-1", post.backgroundStyle && "relative z-10")}>
              <ReactMarkdown components={postComponents} className={cn(post.backgroundStyle && "text-white prose-p:text-white prose-p:text-base sm:prose-p:text-xl prose-p:font-extrabold select-none pointer-events-none")}>
                {enhancePlainImageUrls(postContent)}
              </ReactMarkdown>
            </div>
          </div>
        ) : null;
      })()}
      {/* ── INTERACTIVE CONTENT (POLLS, Q&A, SHARED QUESTIONS) ── */}
      <div className="px-4 sm:px-6 pb-2">
         {/* 1. Shared Lecture Question */}
         {post.sharedQuestion && (
            <div className="mt-2 p-4 sm:p-6 rounded-2xl sm:rounded-[32px] bg-primary/[0.03] border border-primary/10 shadow-sm relative overflow-hidden group">
               <div className="absolute -top-12 -left-12 w-24 h-24 bg-primary/10 blur-3xl rounded-full" />
               <div className="flex items-center gap-3 mb-4">
                  <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                     <FileText size={18} weight="fill" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-primary uppercase tracking-[0.2em]">Shared Lecture Question</p>
                    <p className="text-[10px] font-bold text-slate-400 dark:text-white/30 uppercase tracking-widest mt-0.5">Difficulty: {post.sharedQuestion.difficulty || "Standard"}</p>
                  </div>
               </div>
               <p className="text-[15px] font-bold text-slate-800 dark:text-white leading-relaxed mb-6">{post.sharedQuestion.body}</p>
               <div className="grid grid-cols-1 gap-2.5">
               {(Array.isArray(post.sharedQuestion.choices) ? post.sharedQuestion.choices : []).map((choice: any, idx: number) => {
                  const label = typeof choice === "string" ? choice : (choice?.text || choice?.key || `Option ${idx + 1}`);
                  const key = typeof choice === "object" ? (choice?.key || idx) : idx;
                  return (
                    <div key={key} className="w-full p-4 rounded-2xl bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 text-[13px] font-bold text-slate-700 dark:text-white/80">
                       {key && typeof choice === "object" && choice?.key && (
                         <span className="text-primary font-black mr-2">{choice.key}.</span>
                       )}
                       {label}
                    </div>
                  );
               })}
               </div>
               <p className="mt-4 text-[10px] text-slate-400 dark:text-white/20 font-black uppercase tracking-widest text-center">Open lecture to view correct answer</p>
            </div>
         )}

         {/* 2. Unified Poll & Custom Q&A Logic */}
         {(() => {
            const data = post.poll || post.sharedQuestionData?.poll || (post.sharedQuestionData?.type === 'qa' ? post.sharedQuestionData : null);
            if (!data) return null;
            
            const isQa = data.type === 'qa' || !!post.sharedQuestionData?.type;
            const question = data.question || data.body;
            const options = data.options || data.choices || [];
            
            if (isQa) {
              return (
                <div className="mt-2 p-4 sm:p-6 rounded-2xl sm:rounded-[32px] bg-amber-500/[0.03] border border-amber-500/10 shadow-sm relative overflow-hidden group">
                  <div className="absolute -top-12 -right-12 w-24 h-24 bg-amber-500/10 blur-3xl rounded-full" />
                  <div className="flex items-center gap-3 mb-5">
                     <div className="h-8 w-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                        <ShieldCheck size={18} weight="fill" />
                     </div>
                     <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em]">Interactive Signal Quiz</p>
                  </div>
                  <p className="text-[15px] font-black text-slate-800 dark:text-white leading-relaxed mb-6">{question}</p>
                  <div className="space-y-2.5">
                    {options.map((opt: any, idx: number) => {
                       const optText = typeof opt === "string" ? opt : (opt?.text || opt?.key || `Option ${idx + 1}`);
                       const optKey = typeof opt === "object" ? (opt?.key || idx) : idx;
                       const isSelected = selectedQaIdx === idx;
                       const isCorrect = optText === data.correctAnswer || opt === data.correctAnswer;
                       const showResult = selectedQaIdx !== null;
                       return (
                         <button 
                           key={optKey}
                           disabled={showResult}
                           onClick={() => setSelectedQaIdx(idx)}
                           className={cn(
                             "w-full text-left p-4 rounded-2xl border transition-all relative overflow-hidden",
                             !showResult ? "bg-white dark:bg-black/20 border-slate-200 dark:border-white/10 hover:border-amber-400/50" :
                             isCorrect ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-500" :
                             isSelected ? "bg-red-500/10 border-red-500/50 text-red-500" :
                             "bg-white dark:bg-black/20 border-slate-200 dark:border-white/10 opacity-50"
                           )}
                         >
                           {typeof opt === "object" && opt?.key && (
                             <span className="font-black mr-2">{opt.key}.</span>
                           )}
                           <span className="text-[13px] font-bold relative z-10">{optText}</span>
                         </button>
                       );
                    })}
                  </div>
                  {selectedQaIdx !== null && (
                    <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-[10px] text-slate-400 dark:text-white/20 font-black uppercase tracking-widest mt-5 text-center">
                      {options[selectedQaIdx] === data.correctAnswer ? <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{marginRight:4}}><polyline points="20 6 9 17 4 12"/></svg> Signal Verified - Correct!</> : <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight:4}}><circle cx="12" cy="12" r="10"/><line x1="22" y1="2" x2="2" y2="22"/></svg> Signal Jammed - Incorrect</>}
                    </motion.p>
                  )}
                </div>
              );
            }

            // Regular Poll
            return (
              <div className="mt-2 p-4 sm:p-6 rounded-2xl sm:rounded-[32px] bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5 shadow-inner">
                <div className="flex items-center gap-3 mb-5">
                   <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                      <ChartBar size={18} weight="fill" />
                   </div>
                   <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Community Pulse Poll</p>
                </div>
                <p className="text-[15px] font-black text-slate-800 dark:text-white mb-6">{data.question}</p>
                <div className="space-y-3">
                  {data.options?.map((opt: any, idx: number) => {
                     const votes = opt._count?.votes || 0;
                     const total = data.options.reduce((acc: number, o: any) => acc + (o._count?.votes || 0), 0);
                     const percent = total === 0 ? 0 : Math.round((votes / total) * 100);
                     return (
                       <button key={opt.id || idx} className="relative w-full text-left p-4 rounded-2xl bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 hover:border-primary/50 transition-all overflow-hidden group">
                         <div className="absolute top-0 left-0 bottom-0 bg-primary/10 transition-all duration-1000" style={{ width: `${percent}%` }} />
                         <div className="relative flex justify-between items-center z-10">
                           <span className="text-sm font-bold text-slate-700 dark:text-white/90">{opt.text || opt}</span>
                           <span className="text-[11px] font-black text-slate-400">{percent}%</span>
                         </div>
                       </button>
                     );
                  })}
                </div>
              </div>
            );
         })()}
      </div>

      {/* Attachments (Gallery) */}
      {attachments.length > 0 && (
        <div className="mt-4 mx-4 sm:mx-6 mb-2 rounded-2xl sm:rounded-[24px] overflow-hidden shadow-lg bg-black/5 dark:bg-white/[0.02] border border-slate-200/50 dark:border-white/[0.05]">
          <div className={cn(
            "grid gap-1",
            attachments.filter((a: any) => a.type === 'image').length === 1 ? "grid-cols-1" : 
            attachments.filter((a: any) => a.type === 'image').length === 2 ? "grid-cols-2" : 
            "grid-cols-2"
          )}>
            {allImages.slice(0, 4).map((att: any, i: number) => {
              const totalImages = allImages.length;
              const isLastVisible = i === 3 && totalImages > 4;
              
              return (
                <div 
                  key={i} 
                  onClick={() => setLightboxIndex(i)}
                  className={cn(
                    "relative overflow-hidden group cursor-pointer bg-slate-100/50 dark:bg-black/20",
                    totalImages === 1 ? "w-full max-h-[800px] min-h-[250px]" : 
                    totalImages === 3 && i === 0 ? "row-span-2 h-full" : 
                    totalImages === 3 ? "h-[150px] sm:h-[220px]" :
                    "h-[180px] sm:h-[260px]"
                  )}
                >
                  <img 
                    src={att.url} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.02]" 
                    alt="" 
                  />
                  {isLastVisible && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-md flex flex-col items-center justify-center text-white transition-all group-hover:bg-black/50">
                      <span className="text-4xl font-black drop-shadow-lg">+{totalImages - 4}</span>
                      <span className="text-[10px] font-black uppercase tracking-widest mt-2 opacity-80">More Photos</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              );
            })}
          </div>

          {/* Non-Image Attachments (Videos, Voice, Files) */}
          <div className="p-1 space-y-1">
            {allVideos.map((v: any, i: number) => (
              <div key={i} className="relative group w-full mb-1">
                <ProfessionalVideoPlayer src={v.url} className="w-full max-h-[450px]" />
              </div>
            ))}

            {attachments.filter((a: any) => a.type !== 'image' && !allVideos.some((v: any) => v.url === a.url)).map((att: any, i: number) => (
              <div key={i} className="p-3 bg-white/50 dark:bg-black/20 rounded-xl flex items-center gap-4 group transition-colors hover:bg-white/80 dark:hover:bg-white/5">
                 {att.type === 'audio' || att.type === 'telegram_audio' ? (
                    <InteractiveAudioPlayer url={att.url} duration={att.duration} />
                 ) : (
                  <a href={att.url} target="_blank" className="flex-1 flex items-center gap-3">
                    <div className="h-10 w-10 bg-slate-100 dark:bg-white/5 rounded-xl flex items-center justify-center text-slate-500 group-hover:text-primary transition-colors">
                      <FileText size={22} weight="bold" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-bold text-slate-700 dark:text-white/80 truncate">{att.name || "Attachment"}</p>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/20">{(att.size ? (att.size / 1024).toFixed(1) + ' KB' : 'Document')}</p>
                    </div>
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {inlineTelegramVideo && (
        <div className="mt-2 mx-4 sm:mx-6 mb-2 rounded-2xl sm:rounded-[24px] overflow-hidden shadow-lg bg-black/5 dark:bg-white/[0.02] border border-slate-200/50 dark:border-white/[0.05]">
          <ProfessionalVideoPlayer src={inlineTelegramVideo} className="w-full max-h-[450px]" />
        </div>
      )}

      {/* ── Reactions & Comments Summary ── */}
      {(reactions.length > 0 || (post._count?.comments ?? 0) > 0) && (
        <div className="flex items-center justify-between px-4 sm:px-6 py-2 border-b border-slate-100 dark:border-white/[0.04] text-[12px] text-slate-500 dark:text-white/40 font-bold">
          <div className="flex items-center gap-1.5">
            {reactions.length > 0 && (
              <>
                <div className="flex items-center -space-x-1 select-none">
                  {Object.keys(reactionCounts)
                    .slice(0, 3)
                    .map((type) => (
                      <span key={type} className="flex">
                        {REACTION_MAP[type]?.icon}
                      </span>
                    ))}
                </div>
                <button onClick={async () => {
                  setShowReactionDetail(true);
                  setLoadingReactions(true);
                  try {
                    const res = await fetch(`/api/v1/posts/${post.id}/reactions`);
                    if (res.ok) setReactionUsers(await res.json());
                  } catch {}
                  setLoadingReactions(false);
                }} className="font-bold text-slate-600 dark:text-white/50 hover:text-primary transition-colors">
                  {reactions.length}
                </button>
              </>
            )}
          </div>
          {(post._count?.comments ?? 0) > 0 && (
            <button 
              onClick={() => setShowComments(!showComments)}
              className="hover:underline font-bold text-slate-600 dark:text-white/50"
            >
              {(post._count?.comments ?? 0)} {(post._count?.comments ?? 0) === 1 ? "comment" : "comments"}
            </button>
          )}
        </div>
      )}

      {/* Action Bar */}
      <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-4 mt-1">
        {/* Like/Reaction */}
        <div
          className="relative"
          onMouseEnter={() => {
            if (typeof window !== "undefined" && window.matchMedia("(hover: hover)").matches) {
              setShowReactionPicker(true);
            }
          }}
          onMouseLeave={() => {
            if (typeof window !== "undefined" && window.matchMedia("(hover: hover)").matches) {
              setShowReactionPicker(false);
            }
          }}
        >
          <button
            onClick={handleLikeClick}
            onContextMenu={(e) => {
              e.preventDefault();
              setShowReactionPicker(true);
            }}
            className={cn(
              "flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl transition-all hover:scale-[1.03] active:scale-[0.97] shadow-sm select-none",
              myReaction
                ? `${REACTION_MAP[myReaction]?.color} bg-primary/10 border border-primary/20`
                : "text-slate-500 dark:text-white/30 bg-slate-100 dark:bg-white/5 border border-transparent hover:border-primary/20 hover:text-primary"
            )}
          >
            {myReaction ? (
              <span className="flex">{REACTION_MAP[myReaction]?.icon}</span>
            ) : (
              <Heart className="w-[18px] h-[18px] sm:w-[22px] sm:h-[22px]" />
            )}
            <span className="text-xs sm:text-[13px] font-black">
              {myReaction ? REACTION_MAP[myReaction]?.label : "Like"}
            </span>
          </button>

          <AnimatePresence>
            {showReactionPicker && (
              <>
                <div className="fixed inset-0 z-40 cursor-default" onClick={(e) => { e.stopPropagation(); setShowReactionPicker(false); }} />
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute bottom-full left-0 mb-2 flex items-center gap-1.5 bg-white dark:bg-[#19182C] border border-slate-200 dark:border-white/10 rounded-full px-2.5 py-1.5 shadow-2xl z-50"
                >
                  {Object.entries(REACTION_MAP).map(([type, info]) => (
                    <button
                      key={type}
                      onClick={() => handleReact(type)}
                      className="transition-all hover:scale-125 active:scale-95 duration-200 p-1 text-slate-600 dark:text-white/70"
                      title={info.label}
                    >
                      {info.icon}
                    </button>
                  ))}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        <button onClick={() => setShowComments(!showComments)} className={cn("flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl transition-all hover:scale-[1.03] active:scale-[0.97] shadow-sm", showComments ? "text-primary bg-primary/10 border border-primary/20" : "text-slate-500 dark:text-white/30 bg-slate-100 dark:bg-white/5 border border-transparent hover:border-primary/20 hover:text-primary")}>
          <ChatCircle className="w-[18px] h-[18px] sm:w-[22px] sm:h-[22px]" weight={showComments ? "fill" : "bold"} />
          <span className="text-xs sm:text-[13px] font-black">{post._count?.comments ?? 0}</span>
        </button>
        <button onClick={handleShare} className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl text-slate-500 dark:text-white/30 bg-slate-100 dark:bg-white/5 hover:bg-primary/10 hover:text-primary transition-all hover:scale-[1.03] active:scale-[0.97] shadow-sm">
          <ShareNetwork className="w-[18px] h-[18px] sm:w-[22px] sm:h-[22px]" weight="bold" />
          <span className="text-xs sm:text-[13px] font-black hidden sm:inline">Share</span>
        </button>
        <div className="flex-1" />
        <button 
          onClick={() => {
            setIsSaved(!isSaved);
            toast.success(isSaved ? "Removed from saved posts" : "Post saved successfully!");
          }}
          className={cn("h-8 w-8 sm:h-11 sm:w-11 flex items-center justify-center rounded-xl sm:rounded-2xl transition-all shadow-sm", isSaved ? "text-primary bg-primary/10 border border-primary/20" : "text-slate-400 dark:text-white/20 hover:text-primary hover:bg-primary/5")}
        >
          <BookmarkSimple className="w-[18px] h-[18px] sm:w-[22px] sm:h-[22px]" weight={isSaved ? "fill" : "bold"} />
        </button>
      </div>

      {/* Comments Section */}
      <AnimatePresence>
        {showComments && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.35, ease: "easeInOut" }} className="border-t border-slate-100 dark:border-white/[0.05] bg-slate-50/50 dark:bg-black/10 overflow-hidden">
            <CommentSection postId={post.id} isRoomPost={isRoomPost} roomId={post.roomId} currentUserId={currentUserId} initialCount={post._count?.comments ?? 0} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reaction Detail Modal */}
      <AnimatePresence>
        {showReactionDetail && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm" onClick={() => setShowReactionDetail(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed inset-4 md:inset-x-auto md:top-1/4 md:bottom-auto md:left-1/2 md:-translate-x-1/2 z-[9999] max-w-[380px] w-full bg-white dark:bg-[#161523] rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden shadow-2xl max-h-[60vh] flex flex-col">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-white/[0.04]">
                <span className="text-[13px] font-black text-slate-800 dark:text-white/90">Reactions ({reactions.length})</span>
                <button onClick={() => setShowReactionDetail(false)} className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-all">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {loadingReactions ? (
                  <div className="flex justify-center py-10"><motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}><CircleNotch size={24} className="text-primary/40" /></motion.div></div>
                ) : reactionUsers.length === 0 ? (
                  <p className="text-center py-10 text-xs font-bold text-slate-400 dark:text-white/20 uppercase tracking-widest">No reactions yet</p>
                ) : (
                  reactionUsers.map((item, i) => (
                    <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">
                      <img src={item.user.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(item.user.name)}`} className="h-8 w-8 rounded-full border border-slate-200 dark:border-white/10 object-cover" alt="" />
                      <span className="flex-1 text-[13px] font-bold text-slate-700 dark:text-white/80">{item.user.name}</span>
                      <span className="flex">{REACTION_MAP[item.type]?.icon}</span>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <ConfirmModal isOpen={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} onConfirm={handleDelete} title="Delete Post?" message="This action cannot be undone." confirmText={deleting ? "Deleting..." : "Delete"} variant="danger" />

      <ReportModal open={showReportModal} onClose={() => setShowReportModal(false)} targetType="POST" targetId={post.id} />

      <ConfirmModal
        isOpen={showBlockConfirm}
        onClose={() => setShowBlockConfirm(false)}
        onConfirm={handleBlockUser}
        title="Block user?"
        message={`Are you sure you want to block @${post.author?.name}? Their posts and comments will be hidden from you.`}
        confirmText="Block"
        variant="danger"
      />

      {/* Image Lightbox */}
      {lightboxIndex !== null && (
        <ImageLightbox
          images={allImages.map((a: any) => a.url)}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}

      <PostDetailModal
        post={post}
        currentUserId={currentUserId}
        currentUserRole={currentUserRole}
        currentUserUniversityId={currentUserUniversityId}
        isOpen={showPostModal}
        onClose={() => setShowPostModal(false)}
      />
    </motion.div>
  );
};

export const PostCard = React.memo(PostCardInner);

function InteractiveAudioPlayer({ url, duration }: { url: string; duration?: number }) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = React.useRef<HTMLAudioElement>(null);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setPlaying(!playing);
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    const curr = audioRef.current.currentTime;
    const dur = audioRef.current.duration || 1;
    setCurrentTime(curr);
    setProgress((curr / dur) * 100);
  };

  const handleEnded = () => {
    setPlaying(false);
    setProgress(0);
    setCurrentTime(0);
  };

  const formatAudioTime = (seconds: number) => {
    if (isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const bars = useMemo(() => {
    return [...Array(24)].map(() => 20 + Math.random() * 80);
  }, []);

  return (
    <div className="flex-1 p-2 bg-slate-100/80 dark:bg-white/[0.03] border border-slate-200/50 dark:border-white/[0.05] rounded-2xl flex items-center gap-4 relative overflow-hidden group/audio">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent pointer-events-none" />
      <button onClick={togglePlay} className="h-12 w-12 bg-primary text-white rounded-[18px] flex items-center justify-center shadow-lg shadow-primary/30 group-hover/audio:scale-105 transition-transform flex-shrink-0 z-10">
        {playing ? <Pause size={20} weight="fill" /> : <Play size={20} weight="fill" />}
      </button>
      <div className="flex-1 flex flex-col justify-center min-w-0 z-10">
         <div className="flex items-center gap-1.5 h-6 opacity-60">
            {bars.map((height, j) => (
              <div 
                key={j} 
                className={cn("flex-1 rounded-full transition-all duration-300", progress > (j / 24) * 100 ? "bg-primary" : "bg-primary/30")} 
                style={{ height: `${height}%` }} 
              />
            ))}
         </div>
         <div className="flex items-center justify-between mt-1">
           <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-white/40">Voice Note</p>
           <p className="text-[10px] font-black text-slate-400 dark:text-white/30 tabular-nums">{formatAudioTime(currentTime)} / {duration ? formatAudioTime(duration) : "0:00"}</p>
         </div>
      </div>
      <audio 
        ref={audioRef}
        src={url} 
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        className="hidden" 
      />
    </div>
  );
}

function ImageLightbox({ images, initialIndex, onClose }: { images: string[]; initialIndex: number; onClose: () => void }) {
  const [current, setCurrent] = React.useState(initialIndex);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setCurrent(i => (i + 1) % images.length);
      if (e.key === "ArrowLeft") setCurrent(i => (i - 1 + images.length) % images.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [images.length, onClose]);

  const prev = (e: React.MouseEvent) => { e.stopPropagation(); setCurrent(i => (i - 1 + images.length) % images.length); };
  const next = (e: React.MouseEvent) => { e.stopPropagation(); setCurrent(i => (i + 1) % images.length); };

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-2xl flex items-center justify-center"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-5 right-5 h-11 w-11 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/10 transition-all z-10"
      >
        <X size={20} weight="bold" />
      </button>

      <div className="absolute top-5 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-white/10 border border-white/10 text-white text-[11px] font-black uppercase tracking-widest">
        {current + 1} / {images.length}
      </div>

      {images.length > 1 && (
        <button onClick={prev} className="absolute left-4 h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/10 flex items-center justify-center transition-all hover:scale-110 z-10">
          <ArrowLeft size={22} weight="bold" />
        </button>
      )}

      <AnimatePresence mode="wait">
        <motion.img
          key={current}
          src={images[current]}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.2 }}
          onClick={e => e.stopPropagation()}
          className="max-w-[90vw] max-h-[85vh] object-contain rounded-2xl shadow-2xl select-none"
          alt=""
          draggable={false}
        />
      </AnimatePresence>

      {images.length > 1 && (
        <button onClick={next} className="absolute right-4 h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/10 flex items-center justify-center transition-all hover:scale-110 z-10">
          <ArrowRight size={22} weight="bold" />
        </button>
      )}

      {images.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2">
          {images.map((_: string, i: number) => (
            <button
              key={i}
              onClick={e => { e.stopPropagation(); setCurrent(i); }}
              className={cn(
                "rounded-full transition-all duration-300",
                i === current ? "w-6 h-2 bg-white" : "w-2 h-2 bg-white/30 hover:bg-white/60"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
