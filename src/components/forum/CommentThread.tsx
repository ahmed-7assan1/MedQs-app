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
import { VoiceRecorder } from "./VoiceRecorder";
import { TelegramAudioPlayer } from "./TelegramAudioPlayer";

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
  attachments?: any;
}

interface CommentThreadProps {
  postId: string;
  currentUserId?: string;
  initialCount: number;
}

const renderMentions = (text: string) => {
  if (!text) return "";
  const parts = text.split(/(@[a-zA-Z0-9_\u0600-\u06FF]+)/g);
  return parts.map((part, i) => {
    if (part.startsWith("@")) {
      return (
        <span key={i} className="text-primary font-black hover:underline cursor-pointer">
          {part}
        </span>
      );
    }
    return part;
  });
};

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

  const attachments = (() => {
    if (!comment.attachments) return [];
    if (typeof comment.attachments === "string") {
      try { return JSON.parse(comment.attachments); } catch { return []; }
    }
    if (Array.isArray(comment.attachments)) return comment.attachments;
    return [];
  })();

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
            {comment.content && (
              <p dir="auto" className="text-[12.5px] leading-relaxed text-white/80 font-medium whitespace-pre-wrap break-words">
                {renderMentions(comment.content)}
              </p>
            )}
            {attachments.length > 0 && (
              <div className="mt-2 space-y-2 max-w-full">
                {attachments.map((att: any, idx: number) => {
                  if (att.type === "image") {
                    return (
                      <img
                        key={idx}
                        src={att.url}
                        className="max-h-40 rounded-lg object-contain border border-white/10"
                        alt=""
                      />
                    );
                  }
                  if (att.type === "audio") {
                    return (
                      <TelegramAudioPlayer
                        key={idx}
                        url={att.url}
                        className="max-w-[280px]"
                      />
                    );
                  }
                  return null;
                })}
              </div>
            )}
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
  const [attachments, setAttachments] = useState<any[]>([]);
  const [isRecordingMode, setIsRecordingMode] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const [mentionSearch, setMentionSearch] = useState<string | null>(null);
  const [suggestedUsers, setSuggestedUsers] = useState<any[]>([]);
  const [selectedSuggestIdx, setSelectedSuggestIdx] = useState(0);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadToTelegram = async (file: File | Blob, name?: string) => {
    const fd = new FormData();
    fd.append("file", file, name || (file instanceof File ? file.name : "file"));
    const res = await fetch("/api/v1/debug/telegram-direct-upload", { method: "POST", body: fd });
    const data = await res.json();
    if (!data.success) throw new Error("Upload failed");
    let type: "image" | "audio" | "file" = "file";
    if (file.type?.startsWith("image/")) type = "image";
    else if (file.type?.startsWith("audio/")) type = "audio";
    return {
      url: `/api/v1/files/telegram/preview?fileId=${data.fileId}&type=${type}`,
      type,
      fileId: data.fileId,
    };
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setIsUploading(true);
    try {
      const results = await Promise.all(files.map(f => uploadToTelegram(f)));
      setAttachments(prev => [...prev, ...results]);
    } catch {
      toast.error("Upload failed");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  useEffect(() => {
    if (mentionSearch === null) {
      setSuggestedUsers([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/v1/users/search?q=${mentionSearch}`);
        if (res.ok) {
          const data = await res.json();
          setSuggestedUsers(data);
          setSelectedSuggestIdx(0);
        }
      } catch {}
    }, 200);
    return () => clearTimeout(timer);
  }, [mentionSearch]);

  const checkMentions = (val: string, selectionStart: number) => {
    const textBeforeCursor = val.substring(0, selectionStart);
    const lastAtIdx = textBeforeCursor.lastIndexOf("@");
    if (lastAtIdx !== -1) {
      const query = textBeforeCursor.substring(lastAtIdx + 1);
      if (!query.includes(" ") && query.length >= 0) {
        setMentionSearch(query);
        return;
      }
    }
    setMentionSearch(null);
  };

  const insertMention = (user: any) => {
    const val = text;
    const selectionStart = inputRef.current?.selectionStart || 0;
    const textBeforeCursor = val.substring(0, selectionStart);
    const lastAtIdx = textBeforeCursor.lastIndexOf("@");
    if (lastAtIdx === -1) return;

    const userHandle = user.nickname || user.name.replace(/\s+/g, "_");
    const replacement = `@${userHandle} `;
    
    const newVal = val.substring(0, lastAtIdx) + replacement + val.substring(selectionStart);
    setText(newVal);
    setMentionSearch(null);
    setSuggestedUsers([]);

    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        const cursorPosition = lastAtIdx + replacement.length;
        inputRef.current.setSelectionRange(cursorPosition, cursorPosition);
      }
    }, 10);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (suggestedUsers.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedSuggestIdx(prev => (prev + 1) % suggestedUsers.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedSuggestIdx(prev => (prev - 1 + suggestedUsers.length) % suggestedUsers.length);
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        insertMention(suggestedUsers[selectedSuggestIdx]);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setMentionSearch(null);
        setSuggestedUsers([]);
        return;
      }
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handlePost();
    }
  };

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
        body: JSON.stringify({ content: text, parentId: replyTo?.id ?? null, attachments }),
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
        setAttachments([]);
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
    const val = e.target.value;
    setText(val);
    checkMentions(val, e.target.selectionStart);
    
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
      <div className="relative p-4 bg-black/20 border-t border-white/[0.05]">
        {suggestedUsers.length > 0 && (
          <div className="absolute bottom-full left-4 right-4 mb-2 bg-[#19182C] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 max-h-48 overflow-y-auto">
            {suggestedUsers.map((user, idx) => (
              <button
                key={user.id}
                onClick={() => insertMention(user)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-2 text-right transition-colors hover:bg-white/5",
                  idx === selectedSuggestIdx ? "bg-primary/20" : ""
                )}
              >
                <img
                  src={user.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.name)}`}
                  className="h-6 w-6 rounded-full border border-white/10"
                  alt=""
                />
                <div className="flex flex-col text-right">
                  <span className="text-xs font-black text-white">{user.name}</span>
                  {user.nickname && <span className="text-[10px] text-white/40">@{user.nickname}</span>}
                </div>
              </button>
            ))}
          </div>
        )}

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
            <textarea dir="auto"
              ref={inputRef}
              value={text}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
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
                <label className="h-8 w-8 flex items-center justify-center rounded-lg text-white/20 hover:text-primary hover:bg-primary/10 transition-all cursor-pointer">
                  <ImageIcon size={18} />
                  <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileInput} />
                </label>
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setIsRecordingMode(!isRecordingMode)}
                  className={cn("h-8 w-8 flex items-center justify-center rounded-lg transition-all", isRecordingMode ? "text-primary bg-primary/10" : "text-white/20 hover:text-primary hover:bg-primary/10")}
                >
                  <Microphone size={18} />
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={handlePost}
            disabled={posting || (!text.trim() && attachments.length === 0)}
            className={cn(
              "h-12 w-12 flex items-center justify-center rounded-2xl transition-all shadow-lg active:scale-95",
              text.trim() || attachments.length > 0
                ? "bg-primary text-white shadow-primary/20 hover:bg-primary/90" 
                : "bg-white/[0.02] text-white/10 border border-white/[0.05]"
            )}
          >
            {posting ? <CircleNotch size={20} className="animate-spin" /> : <PaperPlaneTilt size={20} weight="fill" />}
          </button>
        </div>

        {/* Attachments Preview */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3 pl-1">
            {attachments.map((att, idx) => (
              <div key={idx} className="relative group h-14 w-14 rounded-xl overflow-hidden border border-white/10">
                {att.type === "image" ? (
                  <img src={att.url} className="h-full w-full object-cover" alt="" />
                ) : (
                  <div className="h-full w-full flex flex-col items-center justify-center bg-white/5 text-[9px] font-black uppercase text-indigo-400">
                    <Microphone size={16} />
                    <span>Voice</span>
                  </div>
                )}
                <button
                  onClick={() => setAttachments(prev => prev.filter((_, i) => i !== idx))}
                  className="absolute top-1 right-1 h-5 w-5 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                >
                  <span className="text-[10px] text-white">✕</span>
                </button>
              </div>
            ))}
          </div>
        )}

        {isUploading && (
          <div className="flex items-center gap-2 mt-3 px-1 text-xs text-white/30">
            <CircleNotch size={14} className="animate-spin text-primary" />
            <span>Uploading comment attachment...</span>
          </div>
        )}

        <AnimatePresence>
          {isRecordingMode && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="mt-4">
              <VoiceRecorder 
                onStop={async (blob) => {
                  const att = await uploadToTelegram(blob, `comment_voice_${Date.now()}.webm`);
                  setAttachments(prev => [...prev, att]);
                  setIsRecordingMode(false);
                }}
                onCancel={() => setIsRecordingMode(false)}
              />
            </motion.div>
          )}
        </AnimatePresence>
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
