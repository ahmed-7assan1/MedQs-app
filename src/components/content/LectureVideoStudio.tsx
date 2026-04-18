"use client";

import { useMemo, useState, useRef } from "react";
import { cn } from "@/lib/utils";
import {
  Heart, MessageSquare, Share2, Send, PlayCircle,
  Plus, Trash2, ChevronDown, ChevronUp, Link2, Video, Loader2, X,
  ThumbsUp, ThumbsDown, CornerDownRight, ChevronLeft, CheckCircle2,
  ChevronRight
} from "lucide-react";
import toast from "react-hot-toast";
import { CustomVideoPlayer } from "./CustomVideoPlayer";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { Sparkles } from "lucide-react";

type VideoItem = {
  id: string;
  title: string;
  url: string;
  sourceType: string;
  sharingEnabled: boolean;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  likedByMe?: boolean;
};

export type CommentItem = {
  id: string;
  content: string;
  createdAt: string;
  user: { id: string; name: string; nickname?: string | null; image?: string | null };
  parentId?: string | null;
  userId: string;
};

function getEmbed(url: string) {
  const yt = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/);
  if (yt) return { kind: "youtube", cleanUrl: `https://www.youtube.com/watch?v=${yt[1]}`, id: yt[1] };
  const gd = url.match(/drive\.google\.com\/file\/d\/([^/]+)/);
  if (gd) return { kind: "drive" };
  if (url.match(/\.(mp4|webm|ogg)$/i)) return { kind: "html5" };
  if (url.includes("/embed/")) return { kind: "embed" };
  return null;
}

const EqualizerIcon = () => (
  <div className="flex items-end gap-[2px] h-3 w-3">
    {[0, 1, 2].map((i) => (
      <motion.div
        key={i}
        animate={{ height: ["20%", "100%", "20%"] }}
        transition={{ 
          duration: 0.6, 
          repeat: Infinity, 
          delay: i * 0.1,
          ease: "easeInOut" 
        }}
        className="w-[2px] bg-primary rounded-full"
      />
    ))}
  </div>
);

export function LectureVideoStudio({
  lectureId,
  initialVideos,
  selectedVideoId,
  isAdmin = false,
  currentUserId = "",
  hubUrl = "",
}: {
  lectureId: string;
  initialVideos: VideoItem[];
  selectedVideoId?: string;
  isAdmin?: boolean;
  currentUserId?: string;
  hubUrl?: string;
}) {
  const [videos, setVideos] = useState(initialVideos);
  const [activeId, setActiveId] = useState(selectedVideoId || initialVideos[0]?.id || "");
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [commentInput, setCommentInput] = useState("");
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [expandedThreads, setExpandedThreads] = useState<Set<string>>(new Set());

  const [showAddVideo, setShowAddVideo] = useState(false);
  const [newVideoTitle, setNewVideoTitle] = useState("");
  const [newVideoUrl, setNewVideoUrl] = useState("");
  const [addingVideo, setAddingVideo] = useState(false);
  const [interactedComments, setInteractedComments] = useState<Record<string, { liked?: boolean, disliked?: boolean }>>({});
  const [playlistVisible, setPlaylistVisible] = useState(true);

  const [channelMetadata, setChannelMetadata] = useState<{ name: string; thumbnail?: string; subscriberCount?: string } | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loadingMetadata, setLoadingMetadata] = useState(false);

  // AI Summary State
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);

  const active = useMemo(() => videos.find((v) => v.id === activeId) ?? null, [videos, activeId]);

  async function loadComments(videoId: string) {
    const res = await fetch(`/api/v1/lectures/${lectureId}/videos/${videoId}/comments`);
    const data = await res.json().catch(() => []);
    setComments(Array.isArray(data) ? data : []);
    setCommentsLoaded(true);
  }

  async function toggleLike() {
    if (!active) return;
    const res = await fetch(`/api/v1/lectures/${lectureId}/videos/${active.id}/like`, { method: "POST" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return toast.error(typeof data.error === "string" ? data.error : "Like failed");
    setVideos((prev) =>
      prev.map((v) =>
        v.id === active.id
          ? { ...v, likedByMe: data.liked, likesCount: Math.max(0, v.likesCount + (data.liked ? 1 : -1)) }
          : v
      )
    );
  }

  async function shareVideo() {
    if (!active) return;
    const res = await fetch(`/api/v1/lectures/${lectureId}/videos/${active.id}/share`, { method: "POST" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return toast.error(typeof data.error === "string" ? data.error : "Share failed");
    const url = `${window.location.origin}${window.location.pathname}?v=${active.id}`;
    await navigator.clipboard.writeText(url).catch(() => { });
    setVideos((prev) => prev.map((v) => (v.id === active.id ? { ...v, sharesCount: data.sharesCount ?? v.sharesCount + 1 } : v)));
    toast.success("Link copied!");
  }

  async function addComment() {
    if (!active || !commentInput.trim()) return;
    const body = { content: commentInput.trim(), parentId: replyToId };
    try {
      const res = await fetch(`/api/v1/lectures/${lectureId}/videos/${active.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return toast.error(typeof data.error === "string" ? data.error : "Comment failed");
      
      setComments((prev) => [...prev, data]);
      setVideos((prev) => prev.map((v) => (v.id === active.id ? { ...v, commentsCount: v.commentsCount + 1 } : v)));
      setCommentInput("");
      setReplyToId(null);
      if (replyToId) {
        setExpandedThreads(prev => new Set(prev).add(replyToId));
      }
      toast.success(replyToId ? "Reply posted!" : "Comment posted!");
    } catch (err) {
      toast.error("Error posting comment");
    }
  }

  async function deleteComment(commentId: string) {
    if (!active || !confirm("Are you sure you want to delete this comment?")) return;
    try {
      const res = await fetch(`/api/v1/lectures/${lectureId}/videos/${active.id}/comments?commentId=${commentId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed");
      setComments((prev) => prev.filter((c) => c.id !== commentId && c.parentId !== commentId));
      setVideos((prev) => prev.map((v) => (v.id === active.id ? { ...v, commentsCount: Math.max(0, v.commentsCount - 1) } : v)));
      toast.success("Comment deleted");
    } catch (err) {
      toast.error("Error deleting comment");
    }
  }

  const toggleThread = (id: string) => {
    setExpandedThreads(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const groupedComments = useMemo(() => {
    const commentIds = new Set(comments.map(c => c.id));
    const parents = comments.filter(c => !c.parentId || !commentIds.has(c.parentId));
    const replies = comments.filter(c => !!c.parentId && commentIds.has(c.parentId));

    return parents.map(p => ({
      ...p,
      replies: replies.filter(r => r.parentId === p.id)
    })).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [comments]);

  async function addVideo() {
    if (!newVideoTitle.trim() || !newVideoUrl.trim()) return toast.error("Fill in title and URL");
    setAddingVideo(true);
    try {
      const res = await fetch(`/api/v1/lectures/${lectureId}/videos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newVideoTitle.trim(), url: newVideoUrl.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return toast.error(typeof data.error === "string" ? data.error : "Failed to add video");
      setVideos((prev) => [...prev, { ...data, likedByMe: false }]);
      setNewVideoTitle("");
      setNewVideoUrl("");
      setShowAddVideo(false);
      toast.success("Video added!");
    } finally {
      setAddingVideo(false);
    }
  }

  async function deleteVideo(videoId: string) {
    if (!confirm("Delete this video from the playlist?")) return;
    const res = await fetch(`/api/v1/lectures/${lectureId}/videos/${videoId}`, { method: "DELETE" });
    if (!res.ok) return toast.error("Failed to delete");
    setVideos((prev) => prev.filter((v) => v.id !== videoId));
    if (activeId === videoId) setActiveId(videos.find((v) => v.id !== videoId)?.id ?? "");
    toast.success("Removed");
  }

  async function generateSummary() {
    if (!active || !active.url.includes("youtube")) return toast.error("AI summary is currently for YouTube only.");
    
    setIsSummarizing(true);
    try {
      const res = await fetch("/api/v1/youtube/transcript", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoUrl: active.url, lectureId })
      });
      const data = await res.json();
      if (res.ok) {
        setAiSummary(data.summary);
        toast.success(data.cached ? "Retrieved from MedQs cache" : "Summary generated successfully!");
      } else {
        toast.error(data.error || "Failed to generate summary");
      }
    } catch {
      toast.error("An error occurred during AI processing");
    } finally {
      setIsSummarizing(false);
    }
  }

  // Fetch YouTube Metadata (Author name, etc)
  useMemo(() => {
    if (!active) return;
    const embed = getEmbed(active.url);
    if (embed?.kind === "youtube") {
      setLoadingMetadata(true);
      
      // 1. Fetch Basic Info (Name/Handle) from oEmbed
      fetch(`https://www.youtube.com/oembed?url=${active.url}&format=json`)
        .then(r => r.json())
        .then(async (data) => {
          const authorUrl = data.author_url || "";
          const handle = authorUrl.split('/').pop() || "";
          
          // 2. Fetch Stats (Subscriber Count) from our Secure API
          const statsRes = await fetch(`/api/v1/youtube/stats?url=${encodeURIComponent(active.url)}`);
          const statsData = await statsRes.json().catch(() => ({}));

          setChannelMetadata({
            name: data.author_name || "Unknown Creator",
            subscriberCount: statsData.subscriberCount || "6.2K",
            thumbnail: handle.startsWith('@') 
              ? `https://unavatar.io/youtube/${handle}`
              : `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(data.author_name || "UC")}`
          });
        })
        .catch(() => setChannelMetadata(null))
        .finally(() => setLoadingMetadata(false));
    } else {
      setChannelMetadata(null);
    }
  }, [active?.id]);

  if (!videos.length && !isAdmin) {
    return <p className="rounded-2xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">No videos uploaded yet.</p>;
  }

  return (
    <div className="mx-auto max-w-[1700px] px-4 md:px-6">
      <div className={cn(
        "grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 transition-all duration-500",
      )}>
        {/* LEFT COLUMN: Video + Info */}
        <section className="min-w-0 space-y-4 lg:col-span-8 xl:col-span-9">
        <div className="overflow-hidden rounded-xl border border-white/10 bg-black aspect-video relative group ring-1 ring-white/5 shadow-2xl">
          {active ? (
            <CustomVideoPlayer key={activeId} url={active.url} title={active.title} />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3 bg-neutral-900 text-sm text-white/40">
              <Video className="h-12 w-12 opacity-20" />
              Select a video to start learning
            </div>
          )}
          
          {/* Playlist Toggle Button (Desktop) */}
          <button
            onClick={() => setPlaylistVisible(!playlistVisible)}
            className="hidden lg:flex absolute top-4 right-4 z-50 h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/60 text-white/70 backdrop-blur-xl transition-all hover:bg-black/80 hover:text-white"
          >
            {playlistVisible ? <ChevronRight className="h-5 w-5" /> : <Link2 className="h-4 w-4" />}
          </button>
        </div>

        {active && (
          <div className="space-y-6">
            <div className="space-y-3">
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
                {active.title}
              </h1>

              {/* YouTube Style Instructor & Actions Row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2">
                {/* Left: Instructor Profile */}
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 md:h-12 md:w-12 rounded-full overflow-hidden border border-white/10 shadow-lg shrink-0">
                    <img 
                      src={channelMetadata?.thumbnail || "https://api.dicebear.com/7.x/avataaars/svg?seed=DrAhmed"} 
                      alt="Instructor"
                      className="h-full w-full object-cover bg-primary/10"
                    />
                  </div>
                  <div className="flex flex-col min-w-0 pr-2">
                    <div className="flex items-center gap-1">
                      <h3 className="text-[15px] md:text-[16px] font-bold text-foreground truncate">
                        {loadingMetadata ? "Loading..." : (channelMetadata?.name || "د. أحمد جمعة")}
                      </h3>
                      <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <span className="text-[11px] md:text-xs text-muted-foreground/60">
                      {channelMetadata?.subscriberCount || "6.2K"} Subscribers
                    </span>
                  </div>
                  <button 
                    onClick={() => setIsFollowing(!isFollowing)}
                    className={cn(
                      "rounded-full px-4 md:px-5 py-1.5 md:py-2 text-[12px] md:text-sm font-bold transition-all active:scale-95 shadow-lg",
                      isFollowing 
                        ? "bg-white/10 text-white ring-1 ring-white/20 hover:bg-white/20" 
                        : "bg-white text-black hover:bg-white/90"
                    )}
                  >
                    {isFollowing ? "Following" : "Follow"}
                  </button>
                </div>

                {/* Right: Action Buttons Group (YouTube Style Pills) */}
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                  <div className="flex items-center rounded-full bg-white/5 ring-1 ring-white/10">
                    <button 
                      onClick={() => void toggleLike()}
                      className={cn(
                        "flex items-center gap-2 rounded-l-full border-r border-white/5 px-4 py-2 text-[13px] font-semibold transition-colors hover:bg-white/5",
                        active.likedByMe ? "text-primary" : "text-foreground"
                      )}
                    >
                      <ThumbsUp className={cn("h-4 w-4", active.likedByMe && "fill-current")} />
                      <span>{active.likesCount}</span>
                    </button>
                    <button className="flex items-center rounded-r-full px-4 py-2 text-foreground transition-colors hover:bg-white/5">
                      <ThumbsDown className="h-4 w-4" />
                    </button>
                  </div>

                  <button 
                    onClick={() => void generateSummary()}
                    disabled={isSummarizing || !active.url.includes("youtube")}
                    className="flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-[13px] font-bold text-primary ring-1 ring-primary/20 transition-all hover:bg-primary/20 active:scale-95 disabled:opacity-40"
                  >
                    {isSummarizing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    <span>Summary</span>
                  </button>

                  <button 
                    onClick={() => void shareVideo()}
                    className="flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-[13px] font-semibold text-foreground ring-1 ring-white/10 transition-all hover:bg-white/10 active:scale-95"
                  >
                    <Share2 className="h-4 w-4" />
                    <span>Share</span>
                  </button>

                  <button className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 ring-1 ring-white/10 hover:bg-white/10">
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* AI Summary Panel */}
            <AnimatePresence>
              {aiSummary && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl border border-primary/20 bg-primary/5 p-6 space-y-4 ring-1 ring-primary/10 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-8 opacity-[0.03] -z-10">
                    <Sparkles className="h-24 w-24 text-primary" />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold font-display flex items-center gap-2 text-primary">
                      <Sparkles className="h-4.5 w-4.5" />
                      AI Insights & Summary
                    </h3>
                    <button onClick={() => setAiSummary(null)} className="text-muted-foreground hover:text-foreground">
                       <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="prose prose-sm dark:prose-invert max-w-none text-foreground/80 leading-relaxed font-arabic">
                    <ReactMarkdown>{aiSummary}</ReactMarkdown>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Comments Preview Box (YouTube Style) */}
            <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10 hover:bg-white/[0.07] transition-colors cursor-pointer" onClick={() => { if(!commentsLoaded) void loadComments(active.id); setCommentsOpen(!commentsOpen); }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[14px] font-bold">Comments <span className="text-muted-foreground ml-1 font-normal">{active.commentsCount}</span></h3>
                <ChevronDown className={cn("h-4 w-4 transition-transform", commentsOpen && "rotate-180")} />
              </div>

              <AnimatePresence>
                {commentsOpen && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="space-y-6">
                      <div className="flex gap-4">
                         <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
                            ME
                         </div>
                         <div className="flex-1 relative">
                            <input 
                              value={commentInput}
                              onChange={(e) => setCommentInput(e.target.value)}
                              onKeyDown={(e) => e.key === "Enter" && void addComment()}
                              placeholder="Write a comment..." 
                              className="w-full bg-muted/30 border border-border/50 rounded-full px-5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/50"
                            />
                            <button 
                              onClick={() => void addComment()}
                              disabled={!commentInput.trim()}
                              className="absolute right-2 top-1.5 h-6 w-6 rounded-full bg-primary flex items-center justify-center text-white disabled:opacity-30 transition-all active:scale-90"
                            >
                               <Send className="h-3 w-3" />
                            </button>
                         </div>
                      </div>

                      <div className="space-y-5">
                        {groupedComments.map(c => (
                          <div key={c.id} className="group flex gap-4 border-b border-border/20 pb-5 last:border-0">
                             <div className="h-8 w-8 rounded-full bg-muted overflow-hidden shrink-0">
                                {c.user.image ? <img src={c.user.image} className="h-full w-full object-cover" /> : <div className="h-full w-full flex items-center justify-center text-[10px] font-bold opacity-30">US</div>}
                             </div>
                             <div className="flex-1 space-y-1">
                                <div className="flex items-center justify-between">
                                   <span className="text-[13px] font-semibold">{c.user.name}</span>
                                   <span className="text-[11px] text-muted-foreground/50">{new Date(c.createdAt).toLocaleDateString()}</span>
                                </div>
                                <p className="text-[14px] text-muted-foreground leading-relaxed">{c.content}</p>
                                <div className="flex items-center gap-4 pt-1">
                                   <button className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground hover:text-red-500 transition-colors">
                                      <Heart className="h-3.5 w-3.5" />
                                      <span>Like</span>
                                   </button>
                                   <button 
                                    onClick={() => { setReplyToId(c.id); setCommentInput(`@${c.user.nickname || c.user.name.split(' ')[0]} `); }}
                                    className="text-[11px] font-medium text-muted-foreground hover:text-primary transition-colors"
                                   >
                                      Reply
                                   </button>
                                   {(c.userId === currentUserId || isAdmin) && (
                                     <button onClick={() => deleteComment(c.id)} className="text-[11px] font-medium text-muted-foreground hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                                        Delete
                                     </button>
                                   )}
                                </div>
                             </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      </section>

      {/* RIGHT COLUMN: Sidebar Playlist */}
      <AnimatePresence>
        {playlistVisible && (
          <motion.aside
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="lg:col-span-4 xl:col-span-3 h-fit lg:sticky lg:top-4"
          >
            <div className="flex flex-col h-full rounded-2xl border border-white/10 bg-black/20 p-4 ring-1 ring-white/5 backdrop-blur-xl">
                <div className="mb-4 flex items-center justify-between">
                   <h3 className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground/60">
                      Lecture Playlist
                   </h3>
                   <div className="flex items-center gap-2">
                    {isAdmin && (
                      <button onClick={() => setShowAddVideo(!showAddVideo)} className="text-[11px] font-semibold text-primary hover:underline transition-all">
                          + Add Video
                      </button>
                    )}
                    <button onClick={() => setPlaylistVisible(false)} className="lg:hidden text-muted-foreground hover:text-foreground">
                      <X className="h-4 w-4" />
                    </button>
                   </div>
                </div>

                {isAdmin && showAddVideo && (
                  <div className="mb-4 space-y-2 rounded-lg border border-primary/20 bg-primary/5 p-3 animate-in slide-in-from-top-2">
                     <input value={newVideoTitle} onChange={e => setNewVideoTitle(e.target.value)} placeholder="Title" className="w-full bg-background/50 border border-border/50 rounded-md px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20" />
                     <input value={newVideoUrl} onChange={e => setNewVideoUrl(e.target.value)} placeholder="Video URL" className="w-full bg-background/50 border border-border/50 rounded-md px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20" />
                     <button onClick={addVideo} disabled={addingVideo} className="w-full bg-primary text-white py-1.5 rounded-md text-xs font-bold hover:bg-primary/90 disabled:opacity-50">
                        {addingVideo ? "Adding..." : "Confirm Add"}
                     </button>
                  </div>
                )}

                <div className="space-y-2 max-h-[100vh] lg:max-h-[600px] overflow-y-auto pr-2 custom-scrollbar flex-1">
                   {videos.map((v, i) => {
                     const isActive = activeId === v.id;
                     const embed = getEmbed(v.url);
                     const thumbUrl = embed?.kind === "youtube" ? `https://i.ytimg.com/vi/${embed.id}/mqdefault.jpg` : null;

                     return (
                       <button
                         key={v.id}
                         onClick={() => { setActiveId(v.id); setCommentsOpen(false); setCommentsLoaded(false); }}
                         className={cn(
                           "relative w-full group flex items-start gap-4 p-2 rounded-xl border border-transparent transition-all",
                           isActive ? "bg-primary/5 border-primary/10" : "hover:bg-muted/40"
                         )}
                       >
                         {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-[3px] bg-primary rounded-r-md" />}

                          <div className="relative w-[120px] md:w-[160px] aspect-[16/9] rounded-lg overflow-hidden border border-white/5 flex-shrink-0 bg-muted/20">
                             {thumbUrl ? (
                               <img src={thumbUrl} className="h-full w-full object-cover transition-transform group-hover:scale-110" />
                             ) : (
                               <div className="h-full w-full flex items-center justify-center opacity-20"><Video className="h-6 w-6" /></div>
                             )}
                             <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <PlayCircle className="h-8 w-8 text-white" />
                             </div>
                             <div className="absolute bottom-1 right-1 bg-black/80 px-1 py-0.5 rounded text-[10px] font-bold text-white leading-none">
                               Section {i + 1}
                             </div>
                          </div>

                          <div className="flex-1 min-w-0 flex flex-col items-start gap-1 py-0.5">
                             <p className={cn(
                               "text-[12px] md:text-[13px] font-bold tracking-tight line-clamp-2 text-left leading-[1.3]",
                               isActive ? "text-primary" : "text-foreground group-hover:text-primary transition-colors"
                             )}>
                               {v.title}
                             </p>
                             <div className="flex flex-col gap-0.5 opacity-40">
                               <span className="text-[10px] md:text-[11px] font-medium">Instructor Gomaa</span>
                               <div className="flex items-center gap-2 text-[10px] md:text-[11px] font-medium">
                                 <span>{v.likesCount} likes</span>
                                 <span>•</span>
                                 <span>{v.commentsCount} comments</span>
                               </div>
                             </div>
                          </div>
                       </button>
                     );
                   })}
                </div>
            </div>

            {hubUrl && (
              <div className="hidden lg:block mt-4">
                <Link 
                  href={hubUrl}
                  className="group flex h-9 items-center gap-2 rounded-lg border border-border bg-muted/20 px-4 text-[13px] font-medium text-muted-foreground transition-all hover:bg-muted hover:text-foreground active:scale-95"
                >
                  <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                  Back to lecture sections
                </Link>
              </div>
            )}
          </motion.aside>
        )}
      </AnimatePresence>

      <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
         <Link 
            href={hubUrl}
            className="flex items-center gap-2 rounded-full bg-background border border-border shadow-xl px-5 py-2 text-sm font-semibold whitespace-nowrap active:scale-95"
         >
            <ChevronLeft className="h-4 w-4" />
            Lecture Sections
         </Link>
      </div>
    </div>
  </div>
);
}
