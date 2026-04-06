"use client";
import { useState, useEffect } from "react";
import { Loader2, Send, Trash2, MessageSquare, Heart, CornerDownRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "@/lib/utils";
import toast from "react-hot-toast";
import { ForumAuthorAvatar } from "./ForumAuthorAvatar";

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  _count?: { likes: number };
  likedByMe?: boolean;
  author: {
    id: string;
    name: string;
    nickname?: string | null;
    image?: string | null;
    hideRank?: boolean;
    rank?: { label: string; badge?: string } | null;
  };
  replies?: Comment[];
}

const RANK_COLORS: Record<string, string> = {
  Newbie:       "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  Active:       "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  Contributor:  "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  Expert:       "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  Elite:        "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

interface CommentThreadProps {
  postId: string;
  currentUserId?: string;
  initialCount: number;
}

function CommentItem({
  comment, currentUserId, postId, onDelete, onReply,
}: {
  comment: Comment;
  currentUserId?: string;
  postId: string;
  onDelete: (id: string) => void;
  onReply: (parentId: string, name: string) => void;
}) {
  const [liked, setLiked] = useState(comment.likedByMe ?? false);
  const [likeCount, setLikeCount] = useState(comment._count?.likes ?? 0);
  const [showReplies, setShowReplies] = useState(false);
  const isOwn = comment.author.id === currentUserId;
  const rankLabel = comment.author.rank?.label ?? "Newbie";
  const displayName = comment.author.nickname || comment.author.name;

  async function handleLike() {
    if (!currentUserId) return;
    const next = !liked;
    setLiked(next);
    setLikeCount(c => c + (next ? 1 : -1));
    await fetch(`/api/v1/comments/${comment.id}/like`, { method: "POST" }).catch(() => {
      setLiked(!next); setLikeCount(c => c + (next ? -1 : 1));
    });
  }

  return (
    <div className="space-y-2">
      <div className="flex items-start gap-2.5">
        {comment.author.image ? (
          <ForumAuthorAvatar
            src={comment.author.image}
            alt={displayName}
            sizePx={28}
            className="h-7 w-7 flex-shrink-0"
          />
        ) : (
          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
            {displayName[0]?.toUpperCase()}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-semibold">{displayName}</span>
            {!comment.author.hideRank && comment.author.rank && (
              <span className={cn("rounded-full px-1.5 py-0.5 text-[9px] font-semibold", RANK_COLORS[rankLabel])}>
                {comment.author.rank.badge} {rankLabel}
              </span>
            )}
            <span className="text-[10px] text-muted-foreground ml-auto">
              {formatDistanceToNow(new Date(comment.createdAt))}
            </span>
          </div>
          <p className="mt-0.5 text-xs leading-relaxed text-foreground">{comment.content}</p>

          {/* Actions */}
          <div className="mt-1.5 flex items-center gap-3">
            <button onClick={handleLike} disabled={!currentUserId}
              className={cn(
                "flex items-center gap-1 text-[10px] transition-colors",
                liked ? "text-red-500" : "text-muted-foreground hover:text-red-500"
              )}>
              <Heart className={cn("h-3 w-3", liked && "fill-current")} />
              {likeCount > 0 && likeCount}
            </button>
            {currentUserId && (
              <button onClick={() => onReply(comment.id, displayName)}
                className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary transition-colors">
                <CornerDownRight className="h-3 w-3" /> Reply
              </button>
            )}
            {(comment.replies?.length ?? 0) > 0 && (
              <button onClick={() => setShowReplies(s => !s)}
                className="text-[10px] text-muted-foreground hover:text-foreground transition-colors">
                {showReplies ? "Hide" : `${comment.replies!.length}`} {comment.replies!.length === 1 ? "reply" : "replies"}
              </button>
            )}
            {isOwn && (
              <button onClick={() => onDelete(comment.id)}
                className="ml-auto text-[10px] text-muted-foreground hover:text-red-500 transition-colors">
                <Trash2 className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Nested replies */}
      {showReplies && comment.replies && comment.replies.length > 0 && (
        <div className="ml-9 space-y-2 border-l-2 border-border pl-3">
          {comment.replies.map(reply => (
            <CommentItem key={reply.id} comment={reply} currentUserId={currentUserId}
              postId={postId} onDelete={onDelete} onReply={onReply} />
          ))}
        </div>
      )}
    </div>
  );
}

export function CommentThread({ postId, currentUserId, initialCount }: CommentThreadProps) {
  const [open, setOpen] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(null);
  const [posting, setPosting] = useState(false);
  const [count, setCount] = useState(initialCount);

  async function loadComments() {
    if (comments.length > 0) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/posts/${postId}/comments`);
      const data = await res.json();
      setComments(data);
    } catch { toast.error("Could not load comments"); }
    finally { setLoading(false); }
  }

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next) loadComments();
  }

  function handleReply(parentId: string, name: string) {
    setReplyTo({ id: parentId, name });
    setOpen(true);
    if (comments.length === 0) loadComments();
  }

  async function handlePost() {
    if (!text.trim() || !currentUserId) return;
    setPosting(true);
    try {
      const res = await fetch(`/api/v1/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text, parentId: replyTo?.id ?? null }),
      });
      if (res.ok) {
        const comment = await res.json();
        if (replyTo) {
          setComments(prev => prev.map(c =>
            c.id === replyTo.id
              ? { ...c, replies: [...(c.replies ?? []), comment] }
              : c
          ));
        } else {
          setComments(c => [...c, comment]);
          setCount(n => n + 1);
        }
        setText("");
        setReplyTo(null);
      } else {
        const err = await res.json();
        toast.error(err.error ?? "Could not post comment");
      }
    } finally { setPosting(false); }
  }

  async function handleDelete(commentId: string) {
    const res = await fetch(`/api/v1/comments/${commentId}`, { method: "DELETE" });
    if (res.ok) {
      setComments(c => c.filter(x => x.id !== commentId));
      setCount(n => Math.max(0, n - 1));
    } else toast.error("Could not delete");
  }

  return (
    <div className="border-t border-border">
      <button onClick={toggle}
        className={cn(
          "flex w-full items-center gap-2 px-4 py-2.5 text-xs font-medium transition-colors",
          open ? "text-primary bg-primary/5" : "text-muted-foreground hover:text-foreground hover:bg-muted"
        )}>
        <MessageSquare className="h-3.5 w-3.5" />
        {count === 0 ? "Add comment" : `${count} comment${count !== 1 ? "s" : ""}`}
        <span className={cn("ml-auto transition-transform text-[10px]", open && "rotate-180")}>▾</span>
      </button>

      {open && (
        <div className="border-t border-border/50 bg-muted/10 px-4 pb-3 pt-3 animate-fade-in space-y-3">
          {loading ? (
            <div className="flex justify-center py-3">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-3">
              {comments.map(c => (
                <CommentItem key={c.id} comment={c} currentUserId={currentUserId}
                  postId={postId} onDelete={handleDelete} onReply={handleReply} />
              ))}
              {comments.length === 0 && (
                <p className="text-center text-xs text-muted-foreground py-2">No comments yet</p>
              )}
            </div>
          )}

          {currentUserId && (
            <div className="space-y-1.5">
              {replyTo && (
                <div className="flex items-center gap-2 rounded-lg bg-primary/5 border border-primary/15 px-2.5 py-1.5">
                  <CornerDownRight className="h-3 w-3 text-primary" />
                  <span className="text-xs text-primary flex-1">Replying to {replyTo.name}</span>
                  <button onClick={() => setReplyTo(null)} className="text-muted-foreground hover:text-foreground">
                    <span className="text-xs">✕</span>
                  </button>
                </div>
              )}
              <div className="flex gap-2">
                <input
                  type="text" value={text}
                  onChange={e => setText(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && !e.shiftKey && handlePost()}
                  placeholder={replyTo ? `Reply to ${replyTo.name}...` : "Write a comment..."}
                  maxLength={1000}
                  className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
                />
                <button onClick={handlePost} disabled={posting || !text.trim()}
                  className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors">
                  {posting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
