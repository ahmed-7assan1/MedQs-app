"use client";

import { useState, useEffect, useRef } from "react";
import { 
  ChatCircle, 
  Heart, 
  Trash, 
  PaperPlaneTilt, 
  ArrowBendDownRight,
  CircleNotch,
  Smiley,
  At,
  Image as ImageIcon,
  Microphone
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "@/lib/utils";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

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

interface CommentThreadProps {
  postId: string;
  currentUserId?: string;
  initialCount: number;
}

function CommentItem({
  comment, 
  currentUserId, 
  onDelete, 
  onReply, 
}: {
  comment: Comment;
  currentUserId?: string;
  onDelete: (id: string) => void;
  onReply: (parentId: string, name: string) => void;
}) {
  const [liked, setLiked] = useState(comment.likedByMe ?? false);
  const [likeCount, setLikeCount] = useState(comment._count?.likes ?? 0);
  const [showReplies, setShowReplies] = useState(false);
  const isOwn = comment.author.id === currentUserId;
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

  const avatarUrl = comment.author.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(displayName)}`;

  return (
    <div className="group/comment relative">
      <div className="flex items-start gap-3">
        <img 
          src={avatarUrl} 
          alt="" 
          className="h-8 w-8 rounded-xl object-cover border border-white/10 flex-shrink-0" 
        />
        
        <div className="flex-1 min-w-0">
          <div className="bg-white/[0.03] border border-white/[0.05] rounded-2xl px-3.5 py-2.5 shadow-sm group-hover/comment:bg-white/[0.05] transition-colors">
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="flex items-center gap-2">
                <span className="text-[12px] font-black text-white">{displayName}</span>
                {comment.author.rank && (
                  <span className="px-1.5 py-0.5 rounded-md bg-[#534AB7]/20 text-[#AFA9EC] text-[8px] font-black uppercase tracking-widest border border-[#534AB7]/10">
                    {comment.author.rank.label}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-bold text-white/20 uppercase tracking-tight">
                {formatDistanceToNow(new Date(comment.createdAt))}
              </span>
            </div>
            <p className="text-[12.5px] leading-relaxed text-white/80 font-medium whitespace-pre-wrap break-words">
              {comment.content}
            </p>
          </div>

          {/* Action Row */}
          <div className="mt-1.5 flex items-center gap-4 px-1">
            <button 
              onClick={handleLike} 
              className={cn(
                "flex items-center gap-1 text-[11px] font-black uppercase tracking-widest transition-all",
                liked ? "text-red-400" : "text-white/30 hover:text-white/60"
              )}
            >
              <Heart size={14} weight={liked ? "fill" : "bold"} />
              {likeCount > 0 && likeCount}
            </button>
            
            <button 
              onClick={() => onReply(comment.id, displayName)}
              className="flex items-center gap-1 text-[11px] font-black uppercase tracking-widest text-white/30 hover:text-white/60 transition-all"
            >
              <ArrowBendDownRight size={14} weight="bold" />
              Reply
            </button>

            {isOwn && (
              <button 
                onClick={() => onDelete(comment.id)}
                className="ml-auto opacity-0 group-hover/comment:opacity-100 transition-opacity text-red-400/40 hover:text-red-400"
              >
                <Trash size={14} weight="bold" />
              </button>
            )}
          </div>

          {/* Replies Toggle */}
          {(comment.replies?.length ?? 0) > 0 && (
            <button 
              onClick={() => setShowReplies(!showReplies)}
              className="mt-2 flex items-center gap-2 text-[10px] font-black text-primary/60 uppercase tracking-widest hover:text-primary transition-colors"
            >
              <div className="w-6 h-[1px] bg-primary/20" />
              {showReplies ? "Hide Replies" : `View ${comment.replies!.length} Replies`}
            </button>
          )}

          {/* Nested Replies */}
          <AnimatePresence>
            {showReplies && comment.replies && comment.replies.length > 0 && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="ml-2 mt-4 space-y-4 border-l border-white/[0.05] pl-4 overflow-hidden"
              >
                {comment.replies.map(reply => (
                  <CommentItem 
                    key={reply.id} 
                    comment={reply} 
                    currentUserId={currentUserId}
                    onDelete={onDelete} 
                    onReply={onReply} 
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export function CommentThread({ postId, currentUserId, initialCount }: CommentThreadProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(null);
  const [posting, setPosting] = useState(false);
  const [count, setCount] = useState(initialCount);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    loadComments();
  }, [postId]);

  const loadComments = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/posts/${postId}/comments`);
      const data = await res.json();
      setComments(Array.isArray(data) ? data : []);
    } catch { 
      toast.error("Handshake failed — could not load comments"); 
    } finally { 
      setLoading(false); 
    }
  };

  const handlePost = async () => {
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
            c.id === replyTo.id ? { ...c, replies: [...(c.replies ?? []), comment] } : c
          ));
        } else {
          setComments(prev => [...prev, comment]);
          setCount(n => n + 1);
        }
        setText("");
        setReplyTo(null);
        if (inputRef.current) inputRef.current.style.height = "auto";
      }
    } catch {
      toast.error("Transmission error");
    } finally { 
      setPosting(false); 
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      const res = await fetch(`/api/v1/comments/${commentId}`, { method: "DELETE" });
      if (res.ok) {
        setComments(prev => {
          // Check top level
          const filtered = prev.filter(x => x.id !== commentId);
          if (filtered.length < prev.length) {
            setCount(n => Math.max(0, n - 1));
            return filtered;
          }
          // Check replies
          return prev.map(c => ({
            ...c,
            replies: c.replies?.filter(r => r.id !== commentId)
          }));
        });
      }
    } catch {
      toast.error("Could not purge comment");
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  };

  return (
    <div className="flex flex-col">
      {/* Comments List */}
      <div className="px-4 py-6 space-y-6">
        {loading ? (
          <div className="flex justify-center py-4">
            <CircleNotch size={24} className="animate-spin text-primary/40" />
          </div>
        ) : comments.length > 0 ? (
          comments.map(c => (
            <CommentItem 
              key={c.id} 
              comment={c} 
              currentUserId={currentUserId}
              onDelete={handleDelete} 
              onReply={(id, name) => {
                setReplyTo({ id, name });
                inputRef.current?.focus();
              }} 
            />
          ))
        ) : (
          <div className="py-4 text-center">
            <p className="text-[11px] font-black uppercase tracking-widest text-white/15 italic">Initialize discussion stream...</p>
          </div>
        )}
      </div>

      {/* Input Area (Premium Design) */}
      <div className="p-4 bg-black/20 border-t border-white/[0.05]">
        {replyTo && (
          <div className="flex items-center justify-between gap-2 mb-3 bg-primary/10 border border-primary/20 rounded-xl px-3 py-1.5">
            <div className="flex items-center gap-2">
              <ArrowBendDownRight size={14} className="text-primary" />
              <span className="text-[10px] font-black uppercase tracking-widest text-primary/80">Replying to {replyTo.name}</span>
            </div>
            <button onClick={() => setReplyTo(null)} className="text-primary hover:text-white transition-colors">
              <span className="text-[14px]">✕</span>
            </button>
          </div>
        )}

        <div className="flex items-end gap-3">
          <div className="flex-1 bg-white/[0.04] border border-white/[0.06] rounded-2xl p-2 focus-within:bg-white/[0.06] focus-within:border-primary/30 transition-all duration-300">
            <textarea
              ref={inputRef}
              value={text}
              onChange={handleTextChange}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handlePost();
                }
              }}
              placeholder={replyTo ? "Compose reply..." : "Broadcast your thoughts..."}
              rows={1}
              className="w-full bg-transparent border-none p-2 text-[14px] text-white placeholder:text-white/15 focus:ring-0 focus:outline-none resize-none min-h-[40px] max-h-[120px] custom-scrollbar"
            />
            
            <div className="flex items-center justify-between px-2 pb-1">
              <div className="flex items-center gap-1">
                <button className="h-8 w-8 flex items-center justify-center rounded-lg text-white/20 hover:text-primary hover:bg-primary/10 transition-all">
                  <Smiley size={18} />
                </button>
                <button className="h-8 w-8 flex items-center justify-center rounded-lg text-white/20 hover:text-primary hover:bg-primary/10 transition-all">
                  <At size={18} />
                </button>
                <button className="h-8 w-8 flex items-center justify-center rounded-lg text-white/20 hover:text-primary hover:bg-primary/10 transition-all">
                  <ImageIcon size={18} />
                </button>
              </div>
              <div className="flex items-center gap-1">
                <button className="h-8 w-8 flex items-center justify-center rounded-lg text-white/20 hover:text-primary hover:bg-primary/10 transition-all">
                  <Microphone size={18} />
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={handlePost}
            disabled={posting || !text.trim()}
            className={cn(
              "h-12 w-12 flex items-center justify-center rounded-2xl transition-all shadow-lg active:scale-95",
              text.trim() 
                ? "bg-primary text-white shadow-primary/20 hover:bg-primary/90" 
                : "bg-white/[0.02] text-white/10 border border-white/[0.05]"
            )}
          >
            {posting ? <CircleNotch size={20} className="animate-spin" /> : <PaperPlaneTilt size={20} weight="fill" />}
          </button>
        </div>
        <p className="mt-2 text-[9px] font-black uppercase tracking-widest text-white/10 text-center">Shift + Enter for new line</p>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}
