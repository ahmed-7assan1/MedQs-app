"use client";

import { useState, useRef, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  Heart,
  ChatCircle,
  ShareNetwork,
  DotsThreeOutline,
  PushPin,
  Trash,
  BookmarkSimple,
  PencilSimple,
} from "@phosphor-icons/react";
import { cn, formatDistanceToNow } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import { enhancePlainImageUrls } from "@/lib/markdown-helpers";
import { markdownComponentsWithImages } from "@/components/ui/MarkdownBody";
import { CommentThread } from "./CommentThread";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { PostGallery } from "./PostGallery";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { SharedQuestionBlock } from "../quiz/SharedQuestionBlock";
import { ProfessionalVideoPlayer } from "@/components/ui/ProfessionalVideoPlayer";
import { PostDetailModal } from "./PostDetailModal";
import { CommentPreview } from "./CommentPreview";

interface Props {
  post: any;
  currentUserId?: string;
  currentUserRole?: string;
  currentUserUniversityId?: string;
}

const REACTION_MAP: Record<string, { emoji: string; label: string; color: string }> = {
  LIKE: { emoji: "👍", label: "أعجبني", color: "text-blue-400" },
  LOVE: { emoji: "❤️", label: "أحببته", color: "text-red-400" },
  SUPPORT: { emoji: "🤝", label: "أدعم", color: "text-emerald-400" },
  SMART: { emoji: "🧠", label: "عبقري", color: "text-indigo-400" },
  CONFUSED: { emoji: "❓", label: "حائر", color: "text-amber-400" },
  IDEA: { emoji: "💡", label: "مفيد", color: "text-yellow-400" },
};

function parseAttachments(raw: any): any[] {
  if (!raw) return [];
  if (typeof raw === "string") { try { const p = JSON.parse(raw); return Array.isArray(p) ? p : p ? [p] : []; } catch { return []; } }
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "object" && raw.url) return [raw];
  if (typeof raw === "object") return Object.values(raw).filter((v: any) => v && typeof v === "object");
  return [];
}

function sanitizeUrl(url: string) {
  if (!url || typeof url !== "string") return url;
  if (url.includes("localhost:3000")) return url.split("localhost:3000")[1];
  return url;
}

function getTimeAgo(date: string) {
  try {
    const d = new Date(date);
    const str = formatDistanceToNow(d).toLowerCase();
    // Get only the first two parts (e.g., '3h' or 'just' 'now')
    const parts = str.split(" ");
    if (parts[0] === "just") return "Just now";
    return parts[0] + " ago";
  } catch {
    return "";
  }
}

// Highlight #hashtags and @mentions in content
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


import Image from "next/image";

export function PostCardRedesigned({
  post,
  currentUserId,
  currentUserRole,
  currentUserUniversityId,
}: Props) {
  const [deleting, setDeleting] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [reactions, setReactions] = useState<{ type: string; userId: string }[]>(post.reactions || []);
  const [showReactionPicker, setShowReactionPicker] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content || "");
  const [savingEdit, setSavingEdit] = useState(false);
  const [postContent, setPostContent] = useState(post.content || "");
  const isEdited = post.updatedAt ? new Date(post.updatedAt).getTime() - new Date(post.createdAt).getTime() > 2000 : false;
  const [editedState, setEditedState] = useState(isEdited);
  const [showPostModal, setShowPostModal] = useState(false);

  if (isDeleted) return null;

  const avatarUrl =
    post.author?.image ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(post.author?.name || "user")}`;

  // Merge legacy imageUrl + new attachments array
  const attachments = (() => {
    function detectType(url: string): "image" | "video" | "audio" | "file" {
      if (url.includes("type=image")) return "image";
      if (url.includes("type=video")) return "video";
      if (url.includes("type=audio")) return "audio";
      if (/\.(png|jpe?g|gif|webp|svg|avif|bmp|ico)(\?|$)/i.test(url)) return "image";
      if (/\.(mp4|mov|webm|avi|mkv)(\?|$)/i.test(url)) return "video";
      if (/\.(mp3|wav|ogg|m4a|aac)(\?|$)/i.test(url)) return "audio";
      return "file";
    }
    const list = parseAttachments(post.attachments).map((a: any) => {
      const url = sanitizeUrl(a.url);
      return { url, type: detectType(url), fileId: a.fileId, name: a.name, size: a.size };
    });
    const img = sanitizeUrl(post.imageUrl);
    if (img && !list.some((a: any) => a.url === img)) {
      const t = detectType(img);
      if (t === "image") list.unshift({ url: img, type: "image" });
      else list.push({ url: img, type: t || "file" });
    }
    return list;
  })();

  const inlineTelegramVideo = useMemo(() => {
    if (attachments.length > 0) return null;
    if (!postContent) return null;
    const match = postContent.match(/https?:\/\/(?:www\.)?(?:t\.me|telegram\.me)\/([a-zA-Z0-9_]+)\/(\d+)/i);
    return match ? match[0] : null;
  }, [postContent, attachments]);

  // Robust shared question parsing
  const sharedQuestion = (() => {
    if (post.sharedQuestion) return post.sharedQuestion;
    if (post.sharedQuestionData) {
      if (typeof post.sharedQuestionData === "string") {
        try { return JSON.parse(post.sharedQuestionData); } catch { return null; }
      }
      return post.sharedQuestionData;
    }
    return null;
  })();

  const canDelete =
    post.authorId === currentUserId ||
    currentUserRole === "SUPER_ADMIN" ||
    (currentUserRole === "ADMIN" && currentUserUniversityId === post.universityId);

  const isAuthor = post.authorId === currentUserId;

  const reactionCounts = reactions.reduce((acc: Record<string, number>, r) => {
    acc[r.type] = (acc[r.type] || 0) + 1;
    return acc;
  }, {});

  const myReaction = currentUserId ? reactions.find((r) => r.userId === currentUserId)?.type : null;

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
        toast.success("تم تعديل المنشور بنجاح");
      } else {
        toast.error("فشل تعديل المنشور");
      }
    } catch {
      toast.error("فشل تعديل المنشور");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleReact = async (type: string | null) => {
    if (!currentUserId) return toast.error("Sign in to react");
    
    const prevReactions = [...reactions];
    let newReactions = reactions.filter((r) => r.userId !== currentUserId);
    if (type) {
      newReactions.push({ type, userId: currentUserId });
    }
    setReactions(newReactions);
    setShowReactionPicker(false);

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
    if (myReaction) {
      handleReact(null);
    } else {
      handleReact("LIKE");
    }
  };

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

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/forum/post/${post.id}`);
      toast.success("Link copied!");
    } catch {
      toast.error("Could not copy link");
    }
  };

  const isClassName = (style: string) => {
    if (!style) return true;
    return !style.startsWith("data:") && !style.startsWith("http") && !style.startsWith("url(") && !style.startsWith("/");
  };

  const hasHashtags = post.content?.includes("#");
  const commentCount = post._count?.comments ?? 0;

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
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onClick={(e) => {
        const target = e.target as HTMLElement;
        if (!target.closest("button, a, textarea, input, [role=\"button\"], [role=\"menuitem\"]")) {
          setShowPostModal(true);
        }
      }}
      className="rounded-[20px] sm:rounded-[24px] bg-[#16152A]/70 border border-white/[0.06] backdrop-blur-xl overflow-hidden shadow-xl hover:border-white/[0.1] transition-colors duration-300 cursor-pointer"
    >
      {/* ── Header ── */}
      <div className="flex items-center gap-3 p-4 pb-0">
        {post.isAnonymous ? (
          <div className="relative flex-shrink-0">
            <Image
              src={avatarUrl}
              alt=""
              width={44}
              height={44}
              className="h-11 w-11 rounded-2xl object-cover border border-white/10"
            />
          </div>
        ) : (
          <Link href={`/profile/u/${post.author?.id}`} className="relative flex-shrink-0">
            <Image
              src={avatarUrl}
              alt=""
              width={44}
              height={44}
              className="h-11 w-11 rounded-2xl object-cover border border-white/10"
            />
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-emerald-500 rounded-full border-2 border-[#16152A]" />
          </Link>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            {post.isAnonymous ? (
              <span className="text-[14px] font-black text-white leading-tight">
                {post.author?.name}
              </span>
            ) : (
              <Link
                href={`/profile/u/${post.author?.id}`}
                className="text-[14px] font-black text-white hover:text-[#AFA9EC] transition-colors leading-tight"
              >
                {post.author?.name}
              </Link>
            )}
            {post.author?.rank && (
              <span className="px-1.5 py-0.5 rounded-md bg-[#534AB7]/20 text-[#AFA9EC] text-[8px] font-black uppercase tracking-widest border border-[#534AB7]/20">
                {post.author.rank.label}
              </span>
            )}
            {post.isPinned && (
              <PushPin size={12} weight="fill" className="text-amber-400" />
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[10px] font-bold text-white/20 uppercase tracking-tight">
              {getTimeAgo(post.createdAt)}
              {editedState && " • معدل"}
            </span>
          </div>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowOptions(!showOptions)}
            className="h-8 w-8 flex items-center justify-center rounded-full text-white/25 hover:text-white hover:bg-white/5 transition-all"
          >
            <DotsThreeOutline size={18} weight="fill" />
          </button>
          <AnimatePresence>
            {showOptions && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowOptions(false)} />
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: -8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -8 }}
                  className="absolute right-0 top-full mt-1 w-44 bg-[#1f1e36] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden py-1"
                >
                  <button
                    onClick={() => { setShowOptions(false); handleShare(); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-white/50 hover:bg-white/5 hover:text-white transition-all text-[12px] font-bold"
                  >
                    <ShareNetwork size={16} weight="bold" />
                    Copy link
                  </button>
                  {isAuthor && (
                    <button
                      onClick={() => { setShowOptions(false); setIsEditing(true); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-white/50 hover:bg-white/5 hover:text-white transition-all text-[12px] font-bold"
                    >
                      <PencilSimple size={16} weight="bold" />
                      تعديل المنشور
                    </button>
                  )}
                  {canDelete && (
                    <button
                      onClick={() => { setShowOptions(false); setShowDeleteConfirm(true); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-red-400 hover:bg-red-500/10 transition-all text-[12px] font-bold"
                    >
                      <Trash size={16} weight="bold" />
                      Delete post
                    </button>
                  )}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Content / Edit Mode ── */}
      {isEditing ? (
        <div className="p-4 space-y-3">
          <div 
            className={cn(
              "relative rounded-2xl transition-all duration-300 overflow-hidden",
              post.backgroundStyle ? "shadow-lg border border-white/10 min-h-[180px] flex items-center justify-center p-6" : "",
              post.backgroundStyle && (isClassName(post.backgroundStyle) ? post.backgroundStyle : "bg-cover bg-center")
            )}
            style={post.backgroundStyle && !isClassName(post.backgroundStyle) ? { backgroundImage: `url("${post.backgroundStyle}")` } : undefined}
          >
            {/* Tint Overlay for Images to ensure readable text */}
            {post.backgroundStyle && (!isClassName(post.backgroundStyle) || post.backgroundStyle.includes("url")) && (
              <div className="absolute inset-0 bg-black/45 z-0" />
            )}
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className={cn(
                "w-full bg-transparent border-none p-0 focus:ring-0 resize-none z-10",
                post.backgroundStyle 
                  ? "text-white placeholder:text-white/60 text-xl font-extrabold text-center leading-normal" 
                  : "w-full min-h-[100px] bg-white/[0.04] border border-white/10 rounded-2xl p-3 text-[14px] text-white placeholder:text-white/15 focus:ring-0 focus:outline-none resize-none"
              )}
              style={{ minHeight: post.backgroundStyle ? "100px" : "100px" }}
              placeholder="عدل منشورك..."
            />
          </div>
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => setIsEditing(false)}
              disabled={savingEdit}
              className="px-4 py-2 rounded-xl text-white/40 hover:bg-white/5 hover:text-white transition-all text-xs font-bold"
            >
              إلغاء
            </button>
            <button
              onClick={handleSaveEdit}
              disabled={savingEdit || !editContent.trim()}
              className="px-4 py-2 rounded-xl bg-primary text-white hover:bg-primary/95 transition-all text-xs font-bold"
            >
              {savingEdit ? "جاري الحفظ..." : "حفظ التعديلات"}
            </button>
          </div>
        </div>
      ) : (
        postContent?.trim() && (
          <div 
            className={cn(
              "px-4 pt-3 pb-1 text-[14px] leading-relaxed text-white/85 font-medium", 
              post.backgroundStyle && `m-4 rounded-2xl p-8 text-center text-xl font-extrabold flex items-center justify-center min-h-[160px] text-white shadow-lg relative overflow-hidden`,
              post.backgroundStyle && (isClassName(post.backgroundStyle) ? post.backgroundStyle : "bg-cover bg-center")
            )}
            style={post.backgroundStyle && !isClassName(post.backgroundStyle) ? { backgroundImage: `url("${post.backgroundStyle}")` } : undefined}
          >
            {/* Tint Overlay for Images to ensure readable text */}
            {post.backgroundStyle && (!isClassName(post.backgroundStyle) || post.backgroundStyle.includes("url")) && (
              <div className="absolute inset-0 bg-black/45 z-0" />
            )}
            
            <div className={cn("w-full relative z-10", post.backgroundStyle && "text-white select-none pointer-events-none")}>
              {hasHashtags ? (
                <p className="whitespace-pre-wrap break-words">
                  {renderContentAndMentions(postContent)}
                </p>
              ) : (
                <div className={cn("prose prose-invert prose-sm max-w-none prose-p:my-0.5", post.backgroundStyle && "text-white prose-p:text-white prose-p:text-xl prose-p:font-extrabold")}>
                  <ReactMarkdown components={postComponents}>
                    {enhancePlainImageUrls(postContent)}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        )
      )}

      {/* ── Poll ── */}
      {post.poll && (
        <div className="mx-4 mt-2 mb-2 p-4 rounded-2xl bg-white/[0.03] border border-white/5">
          <p className="text-sm font-bold text-white mb-3">{post.poll.question}</p>
          <div className="space-y-2">
            {post.poll.options?.map((opt: any) => {
               const totalVotes = post.poll.options.reduce((acc: number, o: any) => acc + (o._count?.votes || 0), 0);
               const percent = totalVotes === 0 ? 0 : Math.round(((opt._count?.votes || 0) / totalVotes) * 100);
               return (
                 <button key={opt.id} className="relative w-full text-left p-3 rounded-xl bg-black/20 border border-white/10 hover:border-emerald-500/50 transition-all overflow-hidden group">
                   <div className="absolute top-0 left-0 bottom-0 bg-emerald-500/20 transition-all duration-500" style={{ width: `${percent}%` }} />
                   <div className="relative flex justify-between items-center z-10">
                     <span className="text-xs font-bold text-white/90 group-hover:text-emerald-400">{opt.text}</span>
                     <span className="text-[10px] font-black text-white/40">{percent}%</span>
                   </div>
                 </button>
               );
            })}
          </div>
        </div>
      )}

      {/* ── Shared Question ── */}
      {sharedQuestion ? (
        <div className="mx-4 mt-2 mb-2">
          <div className="flex items-center gap-2 mb-2 ml-1">
             <span className="px-2 py-0.5 rounded-md bg-[#534AB7]/20 text-[#AFA9EC] text-[9px] font-black uppercase tracking-widest border border-[#534AB7]/20">Question Discussion</span>
          </div>
          <SharedQuestionBlock 
            question={sharedQuestion} 
            className="bg-[#534AB7]/5 border-[#534AB7]/20"
          />
        </div>
      ) : (
        /* Hidden Debug for me */
        <span className="hidden">No SQ Data</span>
      )}

      {/* ── Media Gallery ── */}
      {attachments.length > 0 && (
        <div className="mt-2 mx-4 mb-1 rounded-2xl overflow-hidden">
          <PostGallery attachments={attachments} />
        </div>
      )}

      {inlineTelegramVideo && (
        <div className="mt-2 mx-4 mb-2 rounded-2xl overflow-hidden border border-white/[0.06] shadow-lg bg-black">
          <ProfessionalVideoPlayer src={inlineTelegramVideo} className="w-full max-h-[450px]" />
        </div>
      )}

      {/* ── Reactions & Comments Summary ── */}
      {(reactions.length > 0 || commentCount > 0) && (
        <div className="flex items-center justify-between px-4 py-2 border-b border-white/[0.04] text-[12px] text-white/40">
          <div className="flex items-center gap-1.5">
            {reactions.length > 0 && (
              <>
                <div className="flex items-center -space-x-1 select-none">
                  {Object.keys(reactionCounts)
                    .slice(0, 3)
                    .map((type) => (
                      <span key={type} className="text-[14px]">
                        {REACTION_MAP[type]?.emoji}
                      </span>
                    ))}
                </div>
                <span className="font-bold text-white/50">{reactions.length}</span>
              </>
            )}
          </div>
          {commentCount > 0 && (
            <button 
              onClick={() => setShowComments(!showComments)}
              className="hover:underline font-bold text-white/50"
            >
              {commentCount} تعليق
            </button>
          )}
        </div>
      )}

      {/* ── Top Comments Preview ── */}
      {!showComments && commentCount > 0 && (
        <CommentPreview
          postId={post.id}
          totalComments={commentCount}
          currentUserId={currentUserId}
          onViewAll={() => setShowComments(true)}
        />
      )}

      {/* ── Action Bar ── */}
      <div className="flex items-center gap-1 px-3 py-3">
        {/* Like/Reaction */}
        <div 
          className="relative"
          onMouseEnter={() => setShowReactionPicker(true)}
          onMouseLeave={() => setShowReactionPicker(false)}
        >
          <button
            onClick={handleLikeClick}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.96]",
              myReaction
                ? `${REACTION_MAP[myReaction]?.color} bg-white/5`
                : "text-white/40 hover:bg-white/5 hover:text-white"
            )}
          >
            {myReaction ? (
              <span className="text-[18px]">{REACTION_MAP[myReaction]?.emoji}</span>
            ) : (
              <Heart size={20} />
            )}
            <span className="text-[12px] font-black">
              {myReaction ? REACTION_MAP[myReaction]?.label : "أعجبني"}
            </span>
          </button>

          <AnimatePresence>
            {showReactionPicker && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute bottom-full left-0 mb-2 flex items-center gap-2 bg-[#19182C] border border-white/10 rounded-full px-3 py-2 shadow-2xl z-50"
              >
                {Object.entries(REACTION_MAP).map(([type, info]) => (
                  <button
                    key={type}
                    onClick={() => handleReact(type)}
                    className="text-2xl transition-all hover:scale-130 active:scale-95 duration-200"
                    title={info.label}
                  >
                    {info.emoji}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Comment */}
        <button
          onClick={() => setShowComments(!showComments)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.96]",
            showComments
              ? "text-[#AFA9EC] bg-[#534AB7]/10"
              : "text-white/40 hover:bg-white/5 hover:text-white"
          )}
        >
          <ChatCircle size={20} weight={showComments ? "fill" : "bold"} />
          <span className="text-[12px] font-black">
            {commentCount > 0 ? commentCount.toLocaleString() : "Comment"}
          </span>
        </button>

        {/* Share */}
        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-white/40 hover:bg-white/5 hover:text-white transition-all hover:scale-[1.02] active:scale-[0.96]"
        >
          <ShareNetwork size={20} weight="bold" />
          <span className="text-[12px] font-black">Share</span>
        </button>

        <div className="flex-1" />

        {/* Bookmark */}
        <button className="h-8 w-8 flex items-center justify-center rounded-full text-white/25 hover:text-white hover:bg-white/5 transition-all">
          <BookmarkSimple size={18} weight="bold" />
        </button>
      </div>

      {/* ── Comments ── */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="border-t border-white/[0.05] bg-black/10 overflow-hidden"
          >
            <CommentThread
              postId={post.id}
              currentUserId={currentUserId}
              initialCount={commentCount}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Post?"
        message="This post will be permanently deleted."
        confirmText={deleting ? "Deleting..." : "Delete"}
        variant="danger"
      />

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
}
