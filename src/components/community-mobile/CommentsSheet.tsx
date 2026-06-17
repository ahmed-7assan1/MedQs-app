// src/components/community-mobile/CommentsSheet.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { Heart, Send, X, CornerUpLeft, Trash2 } from "lucide-react";

import type { Comment } from "./types";
import { formatRelativeTime, getInitials } from "./utils";
import { fetchComments, createComment, deleteComment, likeComment } from "./api";
import { useCommunityStore } from "./store";

interface CommentsSheetProps {
  currentUserId: string;
}

export default function CommentsSheet({ currentUserId }: CommentsSheetProps) {
  const postId = useCommunityStore((s) => s.activeCommentsPostId);
  const closeComments = useCommunityStore((s) => s.closeComments);
  const updatePost = useCommunityStore((s) => s.updatePost);
  const posts = useCommunityStore((s) => s.posts);

  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [draft, setDraft] = useState("");
  const [replyTo, setReplyTo] = useState<{ id: string; authorName: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isOpen = Boolean(postId);
  const currentPost = posts.find((p) => p.id === postId);

  useEffect(() => {
    if (!postId) return;
    setIsLoading(true);
    fetchComments(postId)
      .then(setComments)
      .finally(() => setIsLoading(false));
  }, [postId]);

  function handleClose() {
    setDraft("");
    setReplyTo(null);
    setComments([]);
    closeComments();
  }

  function handleDragEnd(_: unknown, info: PanInfo) {
    if (info.offset.y > 120) handleClose();
  }

  async function handleSubmit() {
    if (!postId || !draft.trim() || isSubmitting) return;
    setIsSubmitting(true);
    const content = draft.trim();
    setDraft("");
    try {
      const newComment = await createComment(postId, {
        content,
        parentId: replyTo?.id ?? null,
      });
      if (replyTo) {
        setComments((prev) =>
          prev.map((c) =>
            c.id === replyTo.id ? { ...c, replies: [...(c.replies ?? []), newComment] } : c
          )
        );
      } else {
        setComments((prev) => [...prev, newComment]);
      }
      if (currentPost) {
        updatePost(postId, { commentCount: currentPost.commentCount + 1 });
      }
      setReplyTo(null);
    } catch {
      setDraft(content);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleLike(comment: Comment, parentId?: string) {
    if (!postId) return;
    const optimisticLiked = !comment.likedByMe;
    const optimisticCount = comment.likeCount + (optimisticLiked ? 1 : -1);

    setComments((prev) =>
      prev.map((c) => {
        if (parentId && c.id === parentId) {
          return {
            ...c,
            replies: c.replies?.map((r) =>
              r.id === comment.id
                ? { ...r, likedByMe: optimisticLiked, likeCount: optimisticCount }
                : r
            ),
          };
        }
        if (c.id === comment.id) {
          return { ...c, likedByMe: optimisticLiked, likeCount: optimisticCount };
        }
        return c;
      })
    );

    try {
      await likeComment(postId, comment.id);
    } catch {
      // best effort; could revert here if needed
    }
  }

  async function handleDelete(commentId: string, parentId?: string) {
    if (!postId) return;
    setComments((prev) =>
      parentId
        ? prev.map((c) =>
            c.id === parentId
              ? { ...c, replies: c.replies?.filter((r) => r.id !== commentId) }
              : c
          )
        : prev.filter((c) => c.id !== commentId)
    );
    if (currentPost) {
      updatePost(postId, { commentCount: Math.max(0, currentPost.commentCount - 1) });
    }
    try {
      await deleteComment(postId, commentId);
    } catch {
      // best effort
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 z-[70] bg-black/40"
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 320 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={handleDragEnd}
            className="fixed inset-x-0 bottom-0 z-[71] flex h-[70vh] flex-col rounded-t-3xl border-t border-border/60 bg-background"
          >
            <div className="flex justify-center pt-2.5">
              <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
            </div>

            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-sm font-semibold text-foreground">Comments</span>
              <button
                type="button"
                onClick={handleClose}
                className="rounded-full p-1.5 text-muted-foreground transition-colors active:bg-muted"
                aria-label="Close"
              >
                <X className="h-4 w-4" strokeWidth={1.5} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4">
              {isLoading && (
                <div className="space-y-4 py-2">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="flex gap-2.5 animate-pulse">
                      <div className="h-7 w-7 rounded-full bg-muted" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-2.5 w-24 rounded bg-muted" />
                        <div className="h-2.5 w-40 rounded bg-muted" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!isLoading && comments.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <p className="text-sm text-muted-foreground">No comments yet</p>
                  <p className="mt-1 text-xs text-muted-foreground/70">Be the first to share your thoughts</p>
                </div>
              )}

              <div className="space-y-4 pb-4">
                {comments.map((comment) => (
                  <CommentItem
                    key={comment.id}
                    comment={comment}
                    currentUserId={currentUserId}
                    onLike={() => handleLike(comment)}
                    onReply={() => {
                      setReplyTo({ id: comment.id, authorName: comment.author.name });
                      inputRef.current?.focus();
                    }}
                    onDelete={() => handleDelete(comment.id)}
                  >
                    {comment.replies && comment.replies.length > 0 && (
                      <div className="mt-3 space-y-3 border-l border-border/60 pl-3">
                        {comment.replies.map((reply) => (
                          <CommentItem
                            key={reply.id}
                            comment={reply}
                            currentUserId={currentUserId}
                            compact
                            onLike={() => handleLike(reply, comment.id)}
                            onReply={() => {
                              setReplyTo({ id: comment.id, authorName: reply.author.name });
                              inputRef.current?.focus();
                            }}
                            onDelete={() => handleDelete(reply.id, comment.id)}
                          />
                        ))}
                      </div>
                    )}
                  </CommentItem>
                ))}
              </div>
            </div>

            <div className="border-t border-border/60 px-4 py-3">
              {replyTo && (
                <div className="mb-2 flex items-center justify-between rounded-lg bg-muted/60 px-2.5 py-1.5 text-xs text-muted-foreground">
                  <span>Replying to {replyTo.authorName}</span>
                  <button type="button" onClick={() => setReplyTo(null)} aria-label="Cancel reply">
                    <X className="h-3.5 w-3.5" strokeWidth={1.5} />
                  </button>
                </div>
              )}
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSubmit();
                  }}
                  placeholder="Write a comment…"
                  className="flex-1 rounded-full border border-border/60 bg-muted/40 px-4 py-2 text-sm focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!draft.trim() || isSubmitting}
                  className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-opacity disabled:opacity-40"
                  aria-label="Send"
                >
                  <Send className="h-4 w-4" strokeWidth={1.5} />
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function CommentItem({
  comment,
  currentUserId,
  compact,
  onLike,
  onReply,
  onDelete,
  children,
}: {
  comment: Comment;
  currentUserId: string;
  compact?: boolean;
  onLike: () => void;
  onReply: () => void;
  onDelete: () => void;
  children?: React.ReactNode;
}) {
  const isOwn = comment.author.id === currentUserId;
  const size = compact ? "h-7 w-7" : "h-7 w-7";

  return (
    <div>
      <div className="flex gap-2.5">
        <div className={`relative ${size} flex-shrink-0 overflow-hidden rounded-full bg-muted`}>
          {comment.author.avatarUrl ? (
            <Image src={comment.author.avatarUrl} alt="" fill className="object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[10px] font-medium text-muted-foreground">
              {getInitials(comment.author.name)}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-1.5">
            <span className="text-sm font-semibold text-foreground">{comment.author.name}</span>
            <span className="text-xs text-muted-foreground">{formatRelativeTime(comment.createdAt)}</span>
          </div>
          <p className="mt-0.5 text-sm leading-relaxed text-foreground">{comment.content}</p>
          <div className="mt-1 flex items-center gap-4">
            <button
              type="button"
              onClick={onLike}
              className={`flex items-center gap-1 text-xs transition-colors ${
                comment.likedByMe ? "text-rose-500" : "text-muted-foreground"
              }`}
            >
              <Heart
                className={`h-3.5 w-3.5 ${comment.likedByMe ? "fill-rose-500" : ""}`}
                strokeWidth={1.5}
              />
              {comment.likeCount > 0 && <span>{comment.likeCount}</span>}
            </button>
            <button
              type="button"
              onClick={onReply}
              className="flex items-center gap-1 text-xs text-muted-foreground"
            >
              <CornerUpLeft className="h-3.5 w-3.5" strokeWidth={1.5} />
              Reply
            </button>
            {isOwn && (
              <button
                type="button"
                onClick={onDelete}
                className="flex items-center gap-1 text-xs text-muted-foreground"
              >
                <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
              </button>
            )}
          </div>
        </div>
      </div>
      {children}
    </div>
  );
}
