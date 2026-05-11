"use client";

import { useState, useEffect } from "react";
import { 
  PaperPlaneTilt, 
  CircleNotch, 
  Microphone, 
  Image as ImageIcon,
  DotsThreeVertical,
  Trash,
  X,
  Plus,
  FileText,
  Play
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { VoiceRecorder } from "./VoiceRecorder";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { ProfessionalVideoPlayer } from "@/components/ui/ProfessionalVideoPlayer";

interface Comment {
  id: string;
  content: string;
  attachments?: any;
  authorId: string;
  createdAt: string;
  author: { id: string; name: string; image?: string };
  replies?: Comment[];
}

interface Props {
  postId: string;
  isRoomPost?: boolean;
  roomId?: string;
  currentUserId?: string;
  initialCount: number;
}

export function CommentSection({ postId, isRoomPost, roomId, currentUserId, initialCount }: Props) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [recordingMode, setRecordingMode] = useState(false);
  const [attachments, setAttachments] = useState<any[]>([]);

  const loadComments = async () => {
    try {
      const endpoint = isRoomPost 
        ? `/api/v1/rooms/${roomId}/posts/${postId}/comments` 
        : `/api/v1/posts/${postId}/comments`;
      const res = await fetch(endpoint);
      const data = await res.json();
      setComments(Array.isArray(data) ? data : []);
    } catch { toast.error("Failed to load comments"); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadComments(); }, [postId]);

  const uploadFile = async (file: File | Blob, name?: string) => {
    const fd = new FormData();
    fd.append("file", file, name || "comment_file");
    const res = await fetch("/api/v1/debug/telegram-direct-upload", { method: "POST", body: fd });
    const data = await res.json();
    if (!data.success) throw new Error("Upload failed");
    let type: "image" | "audio" | "file" | "video" = "file";
    if (file.type?.startsWith("image/")) type = "image";
    else if (file.type?.startsWith("audio/")) type = "audio";
    else if (file.type?.startsWith("video/")) type = "video";
    return {
      url: `/api/v1/files/telegram/preview?fileId=${data.fileId}&type=${type}`,
      type,
      fileId: data.fileId
    };
  };

  const handleSend = async (parentId?: string) => {
    if (!content.trim() && attachments.length === 0) return;
    setSending(true);
    try {
      const endpoint = isRoomPost 
        ? `/api/v1/rooms/${roomId}/posts/${postId}/comments` 
        : `/api/v1/posts/${postId}/comments`;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, parentId, attachments }),
      });
      if (res.ok) {
        const newComment = await res.json();
        if (parentId) {
          setComments(prev => prev.map(c => c.id === parentId ? { ...c, replies: [...(c.replies || []), newComment] } : c));
        } else {
          setComments(prev => [newComment, ...prev]);
        }
        setContent("");
        setAttachments([]);
        toast.success("Commented!");
      }
    } catch { toast.error("Failed to send"); }
    finally { setSending(false); }
  };

  return (
    <div className="p-6 flex flex-col gap-6">
      {/* Input Section */}
      <div className="relative rounded-[28px] bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 p-3 shadow-inner group focus-within:ring-2 ring-primary/20 transition-all">
        <div className="flex items-center gap-3">
          <input 
            value={content} 
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder="Add a comment..."
            className="flex-1 bg-transparent border-none p-2 text-sm text-slate-800 dark:text-white/90 placeholder:text-slate-400 dark:placeholder:text-white/20 focus:ring-0 font-medium"
          />
          <div className="flex items-center gap-1 pr-1">
            <button onClick={() => setRecordingMode(!recordingMode)} className={cn("h-9 w-9 flex items-center justify-center rounded-xl transition-all", recordingMode ? "text-primary bg-primary/10" : "text-slate-400 hover:text-primary hover:bg-primary/5")}>
              <Microphone size={20} weight="bold" />
            </button>
            <label className="h-9 w-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-primary hover:bg-primary/5 transition-all cursor-pointer">
              <Plus size={20} weight="bold" />
              <input type="file" className="hidden" onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                try {
                   const att = await uploadFile(file);
                   setAttachments(prev => [...prev, att]);
                } catch { toast.error("Upload failed"); }
              }} />
            </label>
            <button onClick={() => handleSend()} disabled={sending || (!content.trim() && attachments.length === 0)} className="h-9 w-9 bg-primary text-white rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 disabled:opacity-40 transition-all">
              {sending ? <CircleNotch size={18} className="animate-spin" /> : <PaperPlaneTilt size={18} weight="fill" />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {recordingMode && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="mt-3">
              <VoiceRecorder 
                onStop={async (blob, dur) => {
                  const att = await uploadFile(blob);
                  setAttachments(prev => [...prev, { ...att, duration: dur }]);
                  setRecordingMode(false);
                }}
                onCancel={() => setRecordingMode(false)}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {attachments.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2 px-1 pb-1">
            {attachments.map((att, i) => (
              <div key={i} className="px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/10 text-primary text-[10px] font-black uppercase flex items-center gap-2">
                {att.type === 'audio' ? <Microphone size={12} weight="fill" /> : att.type === 'image' ? <ImageIcon size={12} weight="fill" /> : att.type === 'video' ? <Play size={12} weight="fill" /> : <FileText size={12} weight="fill" />}
                {att.type === 'audio' ? "Voice Note" : att.type === 'image' ? "Image" : att.type === 'video' ? "Video" : "Document"}
                <button onClick={() => setAttachments(p => p.filter((_, idx) => idx !== i))} className="text-primary hover:text-red-500"><X size={12} weight="bold" /></button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Comments List */}
      <div className="space-y-6">
        {loading ? (
          <div className="flex justify-center py-10"><CircleNotch size={24} className="animate-spin text-primary/40" /></div>
        ) : comments.length === 0 ? (
          <p className="text-center py-6 text-xs font-bold text-slate-400 dark:text-white/10 uppercase tracking-widest">No comments yet</p>
        ) : (
          comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} isRoomPost={isRoomPost} roomId={roomId} postId={postId} currentUserId={currentUserId} onReply={(c) => setComments(prev => [c, ...prev])} />
          ))
        )}
      </div>
    </div>
  );
}

function CommentItem({ comment, isRoomPost, roomId, postId, currentUserId, onReply, depth = 0 }: { comment: Comment; isRoomPost?: boolean; roomId?: string; postId: string; currentUserId?: string; onReply: (c: Comment) => void, depth?: number }) {
  const [showReply, setShowReply] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [replying, setReplying] = useState(false);

  const attachments = Array.isArray(comment.attachments) ? comment.attachments : [];
  const maxDepth = 4;

  return (
    <div className={cn("group animate-in fade-in slide-in-from-left-2 duration-400", depth > 0 ? "mt-4" : "mt-6")}>
      <div className="flex gap-4">
        <div className="flex flex-col items-center gap-1">
          <img src={comment.author.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.author.name}`} className="h-10 w-10 rounded-xl object-cover border border-slate-200 dark:border-white/10 flex-shrink-0 shadow-sm" alt="" />
          {comment.replies && comment.replies.length > 0 && depth < maxDepth && (
            <div className="flex-1 w-0.5 bg-slate-100 dark:bg-white/5 my-1" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="rounded-[24px] bg-white dark:bg-white/[0.03] border border-slate-100 dark:border-white/5 p-4 shadow-sm group-hover:border-primary/20 transition-colors">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <p className="text-sm font-black text-slate-800 dark:text-white">{comment.author.name}</p>
                {comment.authorId === currentUserId && (
                  <span className="px-1.5 py-0.5 rounded-md bg-primary/10 text-primary text-[8px] font-black uppercase tracking-widest">You</span>
                )}
              </div>
              <p className="text-[10px] font-bold text-slate-400 dark:text-white/20 uppercase tabular-nums">{formatDistanceToNow(new Date(comment.createdAt))} ago</p>
            </div>
            <p className="text-[14px] text-slate-700 dark:text-white/80 leading-relaxed font-medium">{comment.content}</p>
            
            {attachments.map((att, i) => (
              <div key={i} className="mt-3">
                {att.type === 'audio' ? (
                  <div className="p-3 rounded-2xl bg-primary/5 border border-primary/10 flex items-center gap-3">
                    <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center text-white"><Microphone size={16} weight="fill" /></div>
                    <audio src={att.url} controls className="h-8 flex-1 accent-primary" />
                  </div>
                ) : att.type === 'image' ? (
                  <img src={att.url} className="mt-2 rounded-2xl max-h-60 object-cover border border-slate-200 dark:border-white/10" alt="" />
                ) : att.type === 'video' || att.url.toLowerCase().includes('.mp4') ? (
                  <div className="mt-2 rounded-2xl overflow-hidden bg-black border border-slate-200 dark:border-white/10">
                    <ProfessionalVideoPlayer src={att.url} className="w-full max-h-80" />
                  </div>
                ) : (
                  <a href={att.url} target="_blank" className="mt-2 p-3 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center gap-3 hover:border-primary/40 transition-all">
                     <div className="h-8 w-8 bg-slate-200 dark:bg-white/10 rounded-xl flex items-center justify-center text-slate-500"><FileText size={18} weight="bold" /></div>
                     <span className="text-xs font-bold text-slate-600 dark:text-white/70">View Document</span>
                  </a>
                )}
              </div>
            ))}
          </div>
          
          <div className="flex items-center gap-4 mt-2 px-2">
            <button 
              onClick={() => setShowReply(!showReply)} 
              className={cn(
                "text-[10px] font-black uppercase tracking-widest transition-colors",
                showReply ? "text-primary" : "text-slate-400 dark:text-white/20 hover:text-primary"
              )}
            >
              Reply
            </button>
            {comment.authorId === currentUserId && (
              <button className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/20 hover:text-red-500 transition-colors">Delete</button>
            )}
          </div>

          <AnimatePresence>
            {showReply && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mt-3 px-2 overflow-hidden">
                <div className="flex items-center gap-2 p-2 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 focus-within:ring-1 ring-primary/20">
                  <input 
                    value={replyContent} 
                    onChange={(e) => setReplyContent(e.target.value)} 
                    placeholder={`Reply to ${comment.author.name.split(' ')[0]}...`} 
                    className="flex-1 bg-transparent border-none text-[13px] text-slate-800 dark:text-white focus:ring-0 placeholder:text-slate-400 dark:placeholder:text-white/10" 
                    autoFocus
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleReplySubmit()}
                  />
                  <button 
                    onClick={handleReplySubmit}
                    disabled={replying || !replyContent.trim()} 
                    className="h-8 w-8 bg-primary text-white rounded-xl flex items-center justify-center shadow-md disabled:opacity-40"
                  >
                    {replying ? <CircleNotch size={14} className="animate-spin" /> : <PaperPlaneTilt size={14} weight="fill" />}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Recursive Replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className={cn(
              "space-y-1",
              depth < maxDepth ? "pl-4 border-l-2 border-slate-100 dark:border-white/5 ml-1 mt-4" : "mt-4"
            )}>
              {comment.replies.map(reply => (
                <CommentItem 
                  key={reply.id} 
                  comment={reply} 
                  isRoomPost={isRoomPost} 
                  roomId={roomId} 
                  postId={postId} 
                  currentUserId={currentUserId} 
                  onReply={onReply}
                  depth={depth + 1}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  async function handleReplySubmit() {
    if (!replyContent.trim()) return;
    setReplying(true);
    try {
      const endpoint = isRoomPost ? `/api/v1/rooms/${roomId}/posts/${postId}/comments` : `/api/v1/posts/${postId}/comments`;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: replyContent, parentId: comment.id }),
      });
      if (res.ok) { 
        onReply(await res.json()); 
        setReplyContent(""); 
        setShowReply(false); 
        toast.success("Replied!"); 
      }
    } catch { toast.error("Failed to reply"); }
    finally { setReplying(false); }
  }
}

function formatDistanceToNow(date: Date) {
  const diff = Date.now() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d`;
  if (hours > 0) return `${hours}h`;
  if (minutes > 0) return `${minutes}m`;
  return 'now';
}
