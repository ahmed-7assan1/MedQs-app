"use client";

import { useMemo, useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import {
  Heart, MessageSquare, Share2, Send, PlayCircle, Play,
  Plus, Trash2, ChevronDown, ChevronUp, Link2, Video, Loader2, X,
  ThumbsUp, ThumbsDown, CornerDownRight, ChevronLeft, CheckCircle2,
  ChevronRight, Sparkles, VideoOff, Info, GraduationCap, Check, BookOpen
} from "lucide-react";
import toast from "react-hot-toast";
import { CustomVideoPlayer } from "./CustomVideoPlayer";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";

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
  
  const drive = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (drive) return { kind: "drive", cleanUrl: url, id: drive[1] };
  
  return null;
}

function stripLinks(text: string) {
  return text.replace(/https?:\/\/[^\s]+/g, "[Link Removed]");
}

interface LectureVideoStudioProps {
  lectureId: string;
  initialVideos: VideoItem[];
  selectedVideoId?: string;
  isAdmin?: boolean;
  currentUserId?: string;
  hubUrl?: string;
}

export function LectureVideoStudio({ 
  lectureId,
  initialVideos, 
  selectedVideoId,
  isAdmin,
  currentUserId,
  hubUrl
}: LectureVideoStudioProps) {
  const [videos, setVideos] = useState<VideoItem[]>(initialVideos);
  const [activeId, setActiveId] = useState<string | null>(selectedVideoId || (videos.length > 0 ? videos[0].id : null));
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  
  // YouTube Metadata State
  const [channelMetadata, setChannelMetadata] = useState<any>(null);
  const [loadingMetadata, setLoadingMetadata] = useState(false);

  // Admin Actions
  const [showAddVideo, setShowAddVideo] = useState(false);
  const [newVideoTitle, setNewVideoTitle] = useState("");
  const [newVideoUrl, setNewVideoUrl] = useState("");
  const [addingVideo, setAddingVideo] = useState(false);

  // Comments State (Minimal)
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentsLoaded, setCommentsLoaded] = useState(false);

  const active = useMemo(() => videos.find(v => v.id === activeId) || null, [activeId, videos]);

  const playlistProgress = useMemo(() => {
    if (!videos.length) return 0;
    const currentIndex = videos.findIndex(v => v.id === activeId);
    return Math.round(((currentIndex + 1) / videos.length) * 100);
  }, [activeId, videos]);

  const toggleLike = async () => {
    if (!active) return;
    const isLiking = !active.likedByMe;
    
    // Optimistic UI
    const updated = videos.map(v => 
      v.id === active.id 
        ? { ...v, likedByMe: isLiking, likesCount: isLiking ? v.likesCount + 1 : v.likesCount - 1 } 
        : v
    );
    setVideos(updated);

    try {
      // 1. Local Like
      await fetch(`/api/v1/lectures/${lectureId}/videos/${active.id}/like`, { method: "POST" });
      
      // 2. YouTube Sync
      const embed = getEmbed(active.url);
      if (embed?.kind === "youtube") {
        await fetch("/api/v1/youtube/like", {
          method: "POST",
          body: JSON.stringify({ videoId: embed.id, rating: isLiking ? "like" : "none" })
        });
      }
      
      toast.success(isLiking ? "Added to liked videos" : "Removed from liked videos");
    } catch (err) {
      toast.error("Failed to sync like");
    }
  };

  const toggleFollow = async () => {
    if (!channelMetadata?.id) return;
    const isFollowingNow = !isFollowing;
    setIsFollowing(isFollowingNow);

    try {
      await fetch("/api/v1/youtube/subscribe", {
        method: "POST",
        body: JSON.stringify({ channelId: channelMetadata.id, subscribe: isFollowingNow })
      });
      toast.success(isFollowingNow ? `Following ${channelMetadata.name} on YouTube!` : "Unfollowed");
    } catch (err) {
      toast.error("Follow sync failed");
    }
  };

  const shareVideo = async () => {
    if (!active) return;
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    } catch (err) {
      toast.error("Failed to copy link");
    }
  };

  const generateSummary = async () => {
    if (!active) return;
    setIsSummarizing(true);
    try {
      const res = await fetch("/api/v1/ai/summary", {
        method: "POST",
        body: JSON.stringify({ url: active.url, title: active.title }),
      });
      const data = await res.json();
      if (data.summary) {
        setAiSummary(data.summary);
        toast.success("AI Summary generated!");
      }
    } catch (err) {
      toast.error("Failed to generate summary");
    } finally {
      setIsSummarizing(false);
    }
  };

  const addVideo = async () => {
    if (!newVideoTitle || !newVideoUrl) return;
    setAddingVideo(true);
    try {
      // Corrected the path to use lectureId
      const res = await fetch(`/api/v1/lectures/${lectureId}/videos`, {
        method: "POST",
        body: JSON.stringify({ title: newVideoTitle, url: newVideoUrl }),
      });
      const data = await res.json();
      if (data.video) {
        setVideos([...videos, data.video]);
        setNewVideoTitle("");
        setNewVideoUrl("");
        setShowAddVideo(false);
        toast.success("Video added successfully!");
      }
    } catch (err) {
      toast.error("Failed to add video");
    } finally {
      setAddingVideo(false);
    }
  };

  const deleteVideo = async (id: string) => {
    if (!confirm("Are you sure you want to delete this video?")) return;
    try {
      await fetch(`/api/v1/lectures/${lectureId}/videos/${id}`, {
        method: "DELETE",
      });
      setVideos(videos.filter(v => v.id !== id));
      if (activeId === id) setActiveId(videos[0]?.id || null);
      toast.success("Video deleted");
    } catch (err) {
      toast.error("Failed to delete video");
    }
  };

  useEffect(() => {
    const embed = active ? getEmbed(active.url) : null;
    if (embed?.kind === "youtube") {
      setLoadingMetadata(true);
      fetch(`/api/v1/youtube/stats?videoId=${embed.id}`)
        .then(res => res.json())
        .then(data => {
          if (data && !data.error) setChannelMetadata(data);
        })
        .finally(() => setLoadingMetadata(false));
    } else {
      setChannelMetadata(null);
    }
  }, [active?.id, active?.url]);

  if (!videos.length && !isAdmin) {
    return <p className="rounded-[12px] border border-dashed border-[#1a1b2e] py-12 text-center text-[13px] text-[#4a4b6a]">No videos uploaded yet.</p>;
  }

  return (
    <div className="w-full flex flex-col gap-8 animate-in fade-in duration-700">
      {/* 1. INTERNAL SUB-HEADER (Breadcrumbs & Progress) */}
      <div className="w-full py-3 md:py-4 border-b border-[#1a1b2e]/50 bg-[#0c0d18]/30 backdrop-blur-md sticky top-16 md:top-0 z-40 mb-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 md:gap-4">
            {hubUrl && (
              <Link href={hubUrl} className="p-2 rounded-full bg-[#13142a] text-[#818cf8] active:scale-90 transition-all">
                <ChevronLeft className="h-5 w-5" />
              </Link>
            )}
            <div className="flex flex-col min-w-0">
              <span className="text-[8px] md:text-[10px] uppercase tracking-[2px] text-[#4a4b6a] font-black">Studio</span>
              <h2 className="text-[13px] md:text-[14px] font-black text-[#c7d2fe] line-clamp-1">{active?.title || "Loading..."}</h2>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <div className="flex flex-col items-end">
                <span className="text-[9px] md:text-[10px] text-[#4a4b6a] font-black">PROGRESS</span>
                <span className="text-[11px] md:text-[12px] font-black text-primary">{playlistProgress}%</span>
             </div>
             <div className="h-9 w-9 md:h-10 md:w-10 rounded-full border-2 border-[#1a1b2e] p-[2px] relative">
                <div className="absolute inset-0 flex items-center justify-center text-[9px] font-black text-primary">{playlistProgress}%</div>
             </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr,380px] xl:grid-cols-[1fr,420px] gap-8 lg:gap-12 items-start">
          
          {/* LEFT COLUMN: Video & Info */}
          <section className="min-w-0 flex flex-col gap-8">
            {/* 2. THEATER VIDEO CONTAINER (Full Width on Mobile) */}
            <div className="relative group -mx-4 md:mx-0">
              <div className="relative overflow-hidden md:rounded-[24px] bg-black aspect-[16/9] shadow-2xl border-y md:border border-white/5">
                {active ? (
                  <CustomVideoPlayer key={activeId} url={active.url} title={active.title} />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-4 bg-[#0c0d18] text-[#4a4b6a]">
                    <Video className="h-16 w-16 opacity-10 animate-pulse" />
                    <span className="text-xs font-black tracking-widest uppercase">Initializing...</span>
                  </div>
                )}
              </div>
            </div>

            {active && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* 3. LECTURE IDENTITY & ACTIONS */}
                <div className="flex flex-col gap-4 p-1">
                  <h1 className="text-xl md:text-[28px] font-black text-white html[data-theme='light']:text-slate-900 tracking-tight leading-tight">
                    {active.title}
                  </h1>

                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-4 border-b border-[#1a1b2e] html[data-theme='light']:border-black/5">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 md:h-[52px] md:w-[52px] rounded-xl bg-primary/20 shadow-lg">
                        <div className="h-full w-full rounded-xl bg-[#07080f] flex items-center justify-center overflow-hidden">
                          {channelMetadata?.thumbnail ? (
                            <img src={channelMetadata.thumbnail} alt="Instructor" className="h-full w-full object-cover" />
                          ) : (
                            <GraduationCap className="h-5 w-5 text-primary" />
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col min-w-0">
                        <h3 className="text-sm md:text-[16px] font-black text-white html[data-theme='light']:text-slate-900 truncate">
                          {channelMetadata?.name || "MedOneX Expert"}
                        </h3>
                        <span className="text-[10px] text-white/40 html[data-theme='light']:text-slate-500 font-bold uppercase tracking-wider">
                          Verified Instructor
                        </span>
                      </div>
                      <button 
                        onClick={toggleFollow}
                        className={cn(
                          "ml-auto md:ml-4 rounded-xl px-4 py-2 text-[11px] md:text-[14px] font-black transition-all active:scale-95",
                          isFollowing 
                            ? "bg-[#13142a] text-[#818cf8]" 
                            : "bg-red-500 text-white shadow-lg shadow-red-500/20"
                        )}
                      >
                        {isFollowing ? "Following" : "Follow"}
                      </button>
                    </div>

                    <div className="flex items-center justify-around md:justify-end gap-3 bg-[#0c0d18] html[data-theme='light']:bg-black/[0.03] p-2 rounded-2xl md:bg-transparent">
                      <button 
                        onClick={toggleLike}
                        className={cn(
                          "flex flex-col md:flex-row items-center gap-1 md:gap-2 px-4 py-2 rounded-xl text-[12px] font-black transition-all",
                          active.likedByMe ? "bg-primary text-white" : "text-white/40 html[data-theme='light']:text-slate-500"
                        )}
                      >
                        <ThumbsUp className={cn("h-4 w-4", active.likedByMe && "fill-current")} />
                        <span>{channelMetadata?.likeCount || active.likesCount}</span>
                      </button>

                      <button 
                        onClick={() => void generateSummary()}
                        disabled={isSummarizing}
                        className="flex flex-col md:flex-row items-center gap-1 md:gap-2 px-4 py-2 rounded-xl text-white/40 html[data-theme='light']:text-slate-500 active:scale-90"
                      >
                        {isSummarizing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-primary" />}
                        <span className="text-[10px] uppercase">AI Summary</span>
                      </button>

                      <button 
                        onClick={() => void shareVideo()}
                        className="flex flex-col md:flex-row items-center gap-1 md:gap-2 px-4 py-2 rounded-xl text-white/40 html[data-theme='light']:text-slate-500 active:scale-90"
                      >
                        <Share2 className="h-4 w-4" />
                        <span className="text-[10px] uppercase">Share</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* 4. Description Box (Clean Style) */}
                <div 
                  className={cn(
                    "rounded-[16px] bg-[#0c0d18]/40 p-6 text-[15px] leading-[1.8] text-[#a0a1c0] transition-all hover:bg-[#0c0d18]/60",
                    !descriptionExpanded && "cursor-pointer"
                  )} 
                  onClick={() => !descriptionExpanded && setDescriptionExpanded(true)}
                >
                  <div className="flex items-center gap-4 mb-4 text-[14px] font-bold text-[#c7d2fe]">
                    <span className="text-white font-black">{channelMetadata?.viewCount || "0"} views</span>
                    <span className="text-[#4a4b6a] font-normal">•</span>
                    <span className="text-[#818cf8] font-semibold italic uppercase tracking-wider text-[11px]">
                      MedOneX Original Content
                    </span>
                  </div>
                  
                  <div className={cn("whitespace-pre-wrap font-arabic", !descriptionExpanded && "line-clamp-3")}>
                     {channelMetadata?.description ? stripLinks(channelMetadata.description) : "No detailed description available for this lecture video."}
                  </div>

                  <button 
                    onClick={(e) => { e.stopPropagation(); setDescriptionExpanded(!descriptionExpanded); }}
                    className="mt-4 text-[14px] font-[700] text-[#4f46e5] hover:text-[#818cf8] transition-colors"
                  >
                    {descriptionExpanded ? "Show less" : "...more"}
                  </button>
                </div>

                {/* 5. AI Summary Result */}
                <AnimatePresence>
                  {aiSummary && (
                    <motion.div 
                      key="ai-summary"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-[12px] border border-[#4f46e5]/30 bg-[#1e1b4b]/40 p-5 space-y-3 relative overflow-hidden shadow-2xl backdrop-blur-md"
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="text-[14px] font-[600] flex items-center gap-2 text-[#818cf8]">
                          <Sparkles className="h-4 w-4" />
                          AI Lecture Summary
                        </h3>
                        <button onClick={() => setAiSummary(null)} className="text-[#4a4b6a] hover:text-[#ffffff]">
                           <X className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="prose prose-sm prose-invert max-w-none text-[13px] text-[#c0c1e0] font-arabic">
                        <ReactMarkdown>{aiSummary}</ReactMarkdown>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </section>

          {/* 6. INTERACTIVE SIDEBAR (Cinematic Design) */}
          <aside className="sticky top-[100px] flex flex-col gap-6">
            <div className="rounded-[32px] bg-[#0c0d18]/60 backdrop-blur-2xl border border-[#1a1b2e] overflow-hidden shadow-2xl">
              {/* Sidebar Header */}
              <div className="p-6 bg-gradient-to-b from-[#13142a] to-transparent border-b border-[#1a1b2e]">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[12px] font-[800] uppercase tracking-[3px] text-[#4f46e5]">Curriculum Hub</h3>
                  <div className="bg-[#1e1b4b] px-3 py-1 rounded-full text-[10px] font-black text-[#818cf8] border border-[#4f46e5]/30">STUDIO</div>
                </div>
                <h2 className="text-[18px] font-[800] text-white tracking-tight">Lecture Series</h2>
                <div className="mt-4 flex items-center gap-2 text-[#4a4b6a] text-[11px] font-bold">
                   <BookOpen className="h-3.5 w-3.5" />
                   <span>Chapter 4: Advanced Pathology</span>
                </div>
              </div>

              {/* Enhanced Playlist Items */}
              <div className="p-2 md:p-3 space-y-2 md:space-y-3 max-h-[calc(100vh-450px)] overflow-y-auto custom-scrollbar">
                {videos.map((v, i) => {
                  const isActive = activeId === v.id;
                  const embed = getEmbed(v.url);
                  const thumbUrl = embed?.kind === "youtube" ? `https://i.ytimg.com/vi/${embed.id}/mqdefault.jpg` : null;

                  return (
                    <button
                      key={v.id}
                      onClick={() => { setActiveId(v.id); setCommentsOpen(false); setCommentsLoaded(false); }}
                      className={cn(
                        "relative w-full group flex items-center gap-3 p-2.5 md:p-3 rounded-xl md:rounded-2xl transition-all text-left overflow-hidden",
                        isActive ? "bg-[#4f46e5]/10 border border-[#4f46e5]/30" : "hover:bg-[#13142a]"
                      )}
                    >
                      {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#4f46e5]" />}
                      
                      <div className="relative w-[80px] sm:w-[100px] h-[48px] sm:h-[60px] rounded-lg md:rounded-xl overflow-hidden bg-black shrink-0 border border-white/5 shadow-lg group-hover:scale-105 transition-transform">
                        {thumbUrl ? (
                          <img src={thumbUrl} className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center bg-[#13142a]"><Video className="h-5 w-5 text-[#4a4b6a]" /></div>
                        )}
                        {isActive && (
                          <div className="absolute inset-0 bg-[#4f46e5]/40 flex items-center justify-center">
                             <div className="flex gap-[3px] items-end h-[12px]">
                               <div className="w-[3px] bg-white rounded-full animate-bounce" />
                               <div className="w-[3px] bg-white rounded-full animate-bounce delay-75" />
                               <div className="w-[3px] bg-white rounded-full animate-bounce delay-150" />
                             </div>
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className={cn("text-[12px] md:text-[13px] font-[700] leading-[1.3] line-clamp-2", isActive ? "text-[#818cf8]" : "text-[#c7d2fe] group-hover:text-white")}>
                          {v.title}
                        </p>
                        <div className="mt-1 flex items-center gap-2 text-[9px] md:text-[10px] text-[#4a4b6a] font-bold uppercase tracking-wider">
                           <span>0{i + 1}</span>
                           <span>•</span>
                           <span>MedOneX Studio</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Admin Quick Add */}
              {isAdmin && (
                <div className="p-4 border-t border-[#1a1b2e]">
                   <button onClick={() => setShowAddVideo(!showAddVideo)} className="w-full py-3 rounded-xl bg-gradient-to-r from-[#4f46e5] to-[#06b6d4] text-white text-[12px] font-black uppercase tracking-wider shadow-lg shadow-[#4f46e5]/20 hover:scale-[1.02] transition-all">
                      Deploy Video
                   </button>
                </div>
              )}
            </div>

            {/* Admin Form Panel */}
            {isAdmin && showAddVideo && (
              <div className="rounded-[32px] bg-[#0c0d18] border border-[#1a1b2e] p-6 space-y-4 animate-in zoom-in-95 duration-300 shadow-2xl">
                 <h4 className="text-[12px] font-black text-[#818cf8] uppercase tracking-widest">Studio Deployment</h4>
                 <input value={newVideoTitle} onChange={e => setNewVideoTitle(e.target.value)} placeholder="Lecture Title" className="w-full bg-[#07080f] border border-[#1a1b2e] rounded-xl px-4 py-3 text-[13px] text-white focus:ring-1 focus:ring-[#4f46e5] outline-none" />
                 <input value={newVideoUrl} onChange={e => setNewVideoUrl(e.target.value)} placeholder="Source URL" className="w-full bg-[#07080f] border border-[#1a1b2e] rounded-xl px-4 py-3 text-[13px] text-white focus:ring-1 focus:ring-[#4f46e5] outline-none" />
                 <div className="flex gap-2 pt-2">
                   <button onClick={() => setShowAddVideo(false)} className="flex-1 py-3 rounded-xl bg-[#13142a] text-[11px] font-bold text-[#4a4b6a]">Discard</button>
                   <button onClick={addVideo} disabled={addingVideo} className="flex-1 py-3 rounded-xl bg-white text-black text-[11px] font-black uppercase tracking-wider disabled:opacity-50">Publish</button>
                 </div>
              </div>
            )}
          </aside>
        </div>

      {/* BOTTOM RETURN BUTTON */}
      {hubUrl && (
        <div className="mt-16 flex justify-center pb-12">
          <Link 
            href={hubUrl || "#"} 
            className="flex items-center gap-3 px-16 py-4 rounded-[20px] bg-[#0c0d18] border border-[#1a1b2e] text-[16px] font-[700] text-[#c7d2fe] hover:bg-[#13142a] hover:border-[#4f46e5]/30 transition-all shadow-2xl active:scale-95 group"
          >
            <ChevronLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
            Return to Lecture Sections
          </Link>
        </div>
      )}

      {/* MOBILE FLOATING BUTTON */}
      <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        {hubUrl && (
          <Link href={hubUrl || "#"} className="flex items-center gap-2 rounded-full bg-[#0c0d18]/90 backdrop-blur-xl border border-[#1a1b2e] shadow-[0_20px_50px_rgba(0,0,0,0.7)] px-6 py-2.5 text-[12px] font-bold text-[#c7d2fe] whitespace-nowrap active:scale-95 transition-all hover:bg-[#13142a]">
            <ChevronLeft className="h-4 w-4" />
            Lecture Sections
          </Link>
        )}
      </div>


    </div>
  );
}
