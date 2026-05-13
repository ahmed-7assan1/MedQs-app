"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import {
  Heart,
  ChatCircle,
  ShareNetwork,
  DotsThreeOutline,
  PushPin,
  Trash,
  BookmarkSimple,
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

interface Props {
  post: any;
  currentUserId?: string;
  currentUserRole?: string;
  currentUserUniversityId?: string;
}

function parseAttachments(raw: any): any[] {
  if (!raw) return [];
  if (typeof raw === "string") {
    try { return JSON.parse(raw); } catch { return []; }
  }
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "object") return Object.values(raw);
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
    let str = formatDistanceToNow(d).toLowerCase();
    // Remove redundant ' ago' if it exists to prevent double 'AGO' after uppercase CSS
    str = str.replace(" ago", "");
    return str + " ago";
  } catch {
    return "";
  }
}

// Highlight #hashtags in content
function renderContent(text: string) {
  const parts = text.split(/(#\w+)/g);
  return parts.map((part, i) =>
    part.startsWith("#") ? (
      <span key={i} className="text-[#534AB7] font-bold">{part}</span>
    ) : (
      part
    )
  );
}

import Image from "next/image";

export function PostCardRedesigned({
  post,
  currentUserId,
  currentUserRole,
  currentUserUniversityId,
}: Props) {
  const [likeCount, setLikeCount] = useState(post._count?.likes ?? 0);
  const [isLiked, setIsLiked] = useState(post.likedByMe ?? false);
  const [liking, setLiking] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (isDeleted) return null;

  const avatarUrl =
    post.author?.image ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(post.author?.name || "user")}`;

  // Merge legacy imageUrl + new attachments array
  const attachments = (() => {
    const list = parseAttachments(post.attachments).map((a: any) => ({
      ...a,
      url: sanitizeUrl(a.url),
    }));
    const img = sanitizeUrl(post.imageUrl);
    if (img && !list.some((a: any) => a.url === img)) {
      list.unshift({ url: img, type: "image" });
    }
    return list;
  })();

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

  const handleLike = async () => {
    if (!currentUserId) return toast.error("Sign in to like");
    setLiking(true);
    const prev = isLiked;
    setIsLiked(!isLiked);
    setLikeCount((c: number) => c + (isLiked ? -1 : 1));
    try {
      await fetch(`/api/v1/posts/${post.id}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: isLiked ? null : "like" }),
      });
    } catch {
      setIsLiked(prev);
      setLikeCount((c: number) => c + (isLiked ? 1 : -1));
    } finally {
      setLiking(false);
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

  const hasHashtags = post.content?.includes("#");
  const commentCount = post._count?.comments ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-[20px] sm:rounded-[24px] bg-[#16152A]/70 border border-white/[0.06] backdrop-blur-xl overflow-hidden shadow-xl hover:border-white/[0.1] transition-colors duration-300"
    >
      {/* ── Header ── */}
      <div className="flex items-center gap-3 p-4 pb-0">
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
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Link
              href={`/profile/u/${post.author?.id}`}
              className="text-[14px] font-black text-white hover:text-[#AFA9EC] transition-colors leading-tight"
            >
              {post.author?.name}
            </Link>
            {post.author?.rank && (
              <span className="px-1.5 py-0.5 rounded-md bg-[#534AB7]/20 text-[#AFA9EC] text-[8px] font-black uppercase tracking-widest border border-[#534AB7]/20">
                {post.author.rank.label}
              </span>
            )}
            {post.isPinned && (
              <PushPin size={12} weight="fill" className="text-amber-400" />
            )}
          </div>
          <p className="text-[11px] text-white/25 font-bold uppercase tracking-widest mt-0.5">
            {getTimeAgo(post.createdAt)}
          </p>
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

      {/* ── Content ── */}
      {post.content?.trim() && (
        <div className="px-4 pt-3 pb-1 text-[14px] leading-relaxed text-white/85 font-medium">
          {hasHashtags ? (
            <p className="whitespace-pre-wrap break-words">
              {renderContent(post.content)}
            </p>
          ) : (
            <div className="prose prose-invert prose-sm max-w-none prose-p:my-0.5">
              <ReactMarkdown components={markdownComponentsWithImages}>
                {enhancePlainImageUrls(post.content)}
              </ReactMarkdown>
            </div>
          )}
        </div>
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
      {sharedQuestion && (
        <div className="mx-4 mt-2 mb-2">
          <div className="flex items-center gap-2 mb-2 ml-1">
             <span className="px-2 py-0.5 rounded-md bg-[#534AB7]/20 text-[#AFA9EC] text-[9px] font-black uppercase tracking-widest border border-[#534AB7]/20">Question Discussion</span>
          </div>
          <SharedQuestionBlock 
            question={sharedQuestion} 
            className="bg-[#534AB7]/5 border-[#534AB7]/20"
          />
        </div>
      )}

      {/* ── Media Gallery ── */}
      {attachments.length > 0 && (
        <div className="mt-2 mx-4 mb-1 rounded-2xl overflow-hidden">
          <PostGallery attachments={attachments} />
        </div>
      )}

      {/* ── Action Bar ── */}
      <div className="flex items-center gap-1 px-3 py-3">
        {/* Like */}
        <button
          onClick={handleLike}
          disabled={liking}
          className={cn(
            "flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.96]",
            isLiked
              ? "text-red-400 bg-red-500/10"
              : "text-white/40 hover:bg-white/5 hover:text-white"
          )}
        >
          <Heart size={20} weight={isLiked ? "fill" : "bold"} />
          <span className="text-[12px] font-black">
            {likeCount > 0 ? likeCount.toLocaleString() : "Like"}
          </span>
        </button>

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
    </motion.div>
  );
}
