"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import {
  ThumbsUp,
  ThumbsDown,
  Share2,
  Sparkles,
  Download,
  MoreHorizontal,
  CheckCircle2,
  Bell,
  Play,
  Video,
  Loader2,
  X,
  ChevronLeft,
  GraduationCap,
  BookOpen,
  Heart,
} from "lucide-react";
import toast from "react-hot-toast";
import { VidStackPlayer } from "./VidStackPlayer";
import { AmbientVideoWrapper } from "./AmbientVideoWrapper";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import TopBar from "@/components/modules/TopBar";

/* ─── Types ─── */
export type VideoItem = {
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

interface YouTubeStyleVideoPageProps {
  lectureId: string;
  lectureTitle: string;
  moduleId: string;
  initialVideos: VideoItem[];
  selectedVideoId?: string;
  isAdmin?: boolean;
  currentUserId?: string;
  userName?: string | null;
  userImage?: string | null;
  hubUrl?: string;
}

/* ─── Helpers ─── */
function extractYouTubeId(url: string): string | null {
  const m = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|v\/))([a-zA-Z0-9_-]{11})/
  );
  return m?.[1] ?? null;
}

function stripLinks(text: string) {
  return text.replace(/https?:\/\/[^\s]+/g, "[Link Removed]");
}

/* ─── Chip labels (sidebar filter) ─── */
const CHIPS = ["All", "This Lecture", "New", "Popular"];

/* ─── Playing bars animation (YouTube-style) ─── */
function PlayingBars() {
  return (
    <div className="flex gap-[3px] items-end h-[14px]">
      {[0, 75, 150].map((delay) => (
        <div
          key={delay}
          className="w-[3px] rounded-full bg-white animate-bounce"
          style={{ animationDelay: `${delay}ms` }}
        />
      ))}
    </div>
  );
}

/* ─── Main Component ─── */
export function YouTubeStyleVideoPage({
  lectureId,
  lectureTitle,
  moduleId,
  initialVideos,
  selectedVideoId,
  isAdmin,
  currentUserId,
  userName,
  userImage,
  hubUrl,
}: YouTubeStyleVideoPageProps) {
  /* ── State ── */
  const [videos, setVideos] = useState<VideoItem[]>(initialVideos);
  const [activeId, setActiveId] = useState<string | null>(
    selectedVideoId || (initialVideos.length > 0 ? initialVideos[0].id : null)
  );
  const [activeChip, setActiveChip] = useState("All");
  const [descExpanded, setDescExpanded] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [channelMeta, setChannelMeta] = useState<any>(null);
  const [loadingMeta, setLoadingMeta] = useState(false);

  /* ── Derived ── */
  const active = useMemo(
    () => videos.find((v) => v.id === activeId) || null,
    [activeId, videos]
  );

  const ytId = active ? extractYouTubeId(active.url) : null;

  /* Thumbnail for ambient colour extraction — YouTube only */
  const thumbSrc = ytId
    ? `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg`
    : null;

  /* Filtered videos based on chip */
  const filteredVideos = useMemo(() => {
    if (activeChip === "Popular") {
      return [...videos].sort((a, b) => b.likesCount - a.likesCount);
    }
    if (activeChip === "New") {
      return [...videos].slice(-3).reverse();
    }
    return videos; // "All" | "This Lecture"
  }, [videos, activeChip]);

  /* ── Fetch YouTube channel metadata ── */
  useEffect(() => {
    if (!ytId) {
      setChannelMeta(null);
      return;
    }
    setLoadingMeta(true);
    fetch(`/api/v1/youtube/stats?videoId=${ytId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data && !data.error) setChannelMeta(data);
      })
      .catch(() => {})
      .finally(() => setLoadingMeta(false));
  }, [ytId]);

  /* ── Actions ── */
  const toggleLike = async () => {
    if (!active) return;
    const isLiking = !active.likedByMe;
    setVideos((prev) =>
      prev.map((v) =>
        v.id === active.id
          ? {
              ...v,
              likedByMe: isLiking,
              likesCount: isLiking ? v.likesCount + 1 : v.likesCount - 1,
            }
          : v
      )
    );
    try {
      await fetch(`/api/v1/lectures/${lectureId}/videos/${active.id}/like`, {
        method: "POST",
      });
      if (ytId) {
        await fetch("/api/v1/youtube/like", {
          method: "POST",
          body: JSON.stringify({ videoId: ytId, rating: isLiking ? "like" : "none" }),
        });
      }
      toast.success(isLiking ? "Added to liked videos" : "Removed from liked videos");
    } catch {
      toast.error("Failed to sync like");
    }
  };

  const toggleFollow = async () => {
    if (!channelMeta?.id) return;
    const next = !isFollowing;
    setIsFollowing(next);
    try {
      await fetch("/api/v1/youtube/subscribe", {
        method: "POST",
        body: JSON.stringify({ channelId: channelMeta.id, subscribe: next }),
      });
      toast.success(next ? `Following ${channelMeta.name} on YouTube!` : "Unfollowed");
    } catch {
      toast.error("Follow sync failed");
    }
  };

  const shareVideo = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    } catch {
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
    } catch {
      toast.error("Failed to generate summary");
    } finally {
      setIsSummarizing(false);
    }
  };

  /* ── No videos fallback ── */
  if (!videos.length) {
    return (
      <div className="yt-root min-h-screen bg-[var(--yt-bg)] flex flex-col items-center justify-center gap-4">
        <Video className="h-16 w-16 text-white/10" />
        <p className="text-sm text-[var(--yt-muted)]">No videos for this lecture.</p>
        {hubUrl && (
          <Link href={hubUrl} className="text-sm text-[#3ea6ff] hover:underline">
            ← Back to lecture
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="yt-root min-h-screen bg-[var(--yt-bg)] font-sans text-[var(--yt-fg)] animate-in fade-in duration-500">
      {/* ── TOP BAR ── */}
      <TopBar userName={userName} userImage={userImage} isCompact={true} transparentUntilScroll={true} />

      {/* ── MAIN GRID ── */}
      <div className="mx-auto grid max-w-[1800px] gap-6 px-4 pb-16 pt-16 lg:grid-cols-[minmax(0,1fr)_402px] lg:px-6">

        {/* ════════════════════════════════════
            LEFT COLUMN: Video + Info
        ════════════════════════════════════ */}
        <div className="min-w-0 flex flex-col gap-0">

          {/* Back link (mobile) */}
          {hubUrl && (
            <Link
              href={hubUrl}
              className="mb-3 inline-flex items-center gap-1.5 text-xs text-[var(--yt-muted)] hover:text-[var(--yt-hover-fg)] transition-colors lg:hidden"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Back to lecture
            </Link>
          )}

          {/* ── AMBIENT VIDEO CONTAINER ── */}
          <AmbientVideoWrapper thumbSrc={thumbSrc}>
            <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black shadow-2xl">
              {active ? (
                <VidStackPlayer
                  key={activeId}
                  url={active.url}
                  title={active.title}
                  hideBranding
                  thumbnail={thumbSrc}
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-[#0c0d18]">
                  <Video className="h-16 w-16 text-white/10 animate-pulse" />
                </div>
              )}
            </div>
          </AmbientVideoWrapper>

          {/* ── TITLE + AI BADGE ── */}
          <div className="mt-3">
            <h1 className="text-xl font-semibold leading-snug text-[var(--yt-fg)]">
              {active?.title || lectureTitle}
            </h1>
            <div className="mt-1 inline-flex items-center gap-1 text-xs text-[var(--yt-muted)]">
              <Sparkles className="h-3 w-3" />
              <span>MedOneX Original Content</span>
            </div>
          </div>

          {/* ── CHANNEL ROW + ACTIONS ── */}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">

            {/* Channel identity */}
            <div className="flex items-center gap-3">
              {/* Avatar */}
              <div className="h-10 w-10 shrink-0 rounded-full overflow-hidden bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center shadow-lg">
                {channelMeta?.thumbnail ? (
                  <img
                    src={channelMeta.thumbnail}
                    alt="Channel"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <GraduationCap className="h-5 w-5 text-white" />
                )}
              </div>

              {/* Name + subs */}
              <div className="leading-tight">
                <div className="flex items-center gap-1 text-sm font-medium text-[var(--yt-fg)]">
                  {loadingMeta ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-[var(--yt-muted)]" />
                  ) : (
                    channelMeta?.name || "MedOneX Expert"
                  )}
                  <CheckCircle2 className="h-3.5 w-3.5 text-[var(--yt-muted)]" />
                </div>
                <div className="text-xs text-[var(--yt-muted)]">
                  {channelMeta?.subscriberCount
                    ? `${Number(channelMeta.subscriberCount).toLocaleString()} subscribers`
                    : "Verified Instructor"}
                </div>
              </div>

              {/* Subscribe / Follow */}
              <button
                onClick={toggleFollow}
                className={cn(
                  "ml-2 rounded-full px-4 py-2 text-sm font-medium transition-all active:scale-95",
                  isFollowing
                    ? "bg-[var(--yt-surface)] text-[var(--yt-fg)] hover:bg-[var(--yt-surface-hover)]"
                    : "bg-[var(--yt-inverse-bg)] text-[var(--yt-inverse-fg)] hover:opacity-90"
                )}
              >
                {isFollowing ? "Subscribed" : "Subscribe"}
              </button>

              {isFollowing && (
                <button className="flex items-center gap-2 rounded-full bg-[var(--yt-surface)] px-3 py-2 text-sm hover:bg-[var(--yt-surface-hover)]">
                  <Bell className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Like / Dislike pill */}
              <div className="flex items-center rounded-full bg-[var(--yt-surface)]">
                <button
                  onClick={toggleLike}
                  className={cn(
                    "flex items-center gap-2 rounded-l-full px-4 py-2 text-sm transition-colors hover:bg-[var(--yt-surface-hover)]",
                    active?.likedByMe && "text-indigo-400"
                  )}
                >
                  <ThumbsUp
                    className={cn(
                      "h-4 w-4",
                      active?.likedByMe && "fill-current"
                    )}
                  />
                  <span>
                    {channelMeta?.likeCount || active?.likesCount || 0}
                  </span>
                </button>
                <span className="h-6 w-px bg-[var(--yt-border)]" />
                <button
                  className="rounded-r-full px-3 py-2 hover:bg-[var(--yt-surface-hover)] transition-colors"
                  aria-label="Dislike"
                >
                  <ThumbsDown className="h-4 w-4" />
                </button>
              </div>

              {/* Share */}
              <button
                onClick={shareVideo}
                className="flex items-center gap-2 rounded-full bg-[var(--yt-surface)] px-4 py-2 text-sm hover:bg-[var(--yt-surface-hover)] transition-colors"
              >
                <Share2 className="h-4 w-4" />
                <span>Share</span>
              </button>

              {/* AI Ask / Summary */}
              <button
                onClick={() => void generateSummary()}
                disabled={isSummarizing}
                className="flex items-center gap-2 rounded-full bg-[var(--yt-surface)] px-4 py-2 text-sm hover:bg-[var(--yt-surface-hover)] transition-colors disabled:opacity-60"
              >
                {isSummarizing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                <span>Ask AI</span>
              </button>

              {/* Download */}
              <button className="flex items-center gap-2 rounded-full bg-[var(--yt-surface)] px-4 py-2 text-sm hover:bg-[var(--yt-surface-hover)] transition-colors">
                <Download className="h-4 w-4" />
                <span>Download</span>
              </button>

              {/* More */}
              <button
                className="rounded-full bg-[var(--yt-surface)] p-2 hover:bg-[var(--yt-surface-hover)] transition-colors"
                aria-label="More options"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* ── DESCRIPTION BOX ── */}
          <div
            className={cn(
              "mt-4 rounded-xl bg-[var(--yt-surface)] p-3 text-sm cursor-pointer hover:bg-[var(--yt-surface-hover)] transition-colors",
              descExpanded && "cursor-auto hover:bg-[var(--yt-surface)]"
            )}
            onClick={() => !descExpanded && setDescExpanded(true)}
          >
            <div className="flex items-center gap-2 text-xs text-[var(--yt-muted)]">
              <span className="font-medium text-[var(--yt-fg)]">
                {channelMeta?.viewCount
                  ? `${Number(channelMeta.viewCount).toLocaleString()} views`
                  : `${active?.likesCount || 0} likes`}
              </span>
              <span>•</span>
              <span>MedOneX Lecture</span>
              {ytId && <span>• #medicine #medicalstudent</span>}
            </div>
            <p
              className={cn(
                "mt-2 leading-relaxed text-[var(--yt-fg)]",
                !descExpanded && "line-clamp-2"
              )}
            >
              {channelMeta?.description
                ? stripLinks(channelMeta.description)
                : "This is a MedOneX verified lecture video. Tap to expand for more details about this content."}
            </p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setDescExpanded((v) => !v);
              }}
              className="mt-2 text-xs font-medium text-[var(--yt-fg)] hover:text-[var(--yt-hover-fg)]"
            >
              {descExpanded ? "Show less" : "...more"}
            </button>
          </div>

          {/* ── AI SUMMARY PANEL ── */}
          <AnimatePresence>
            {aiSummary && (
              <motion.div
                key="ai-summary"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="mt-4 rounded-xl border border-indigo-500/30 bg-indigo-950/40 p-5 space-y-3 relative overflow-hidden shadow-2xl backdrop-blur-md"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold flex items-center gap-2 text-indigo-300">
                    <Sparkles className="h-4 w-4" />
                    AI Lecture Summary
                  </h3>
                  <button
                    onClick={() => setAiSummary(null)}
                    className="text-[var(--yt-muted)] hover:text-[var(--yt-hover-fg)] transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="prose prose-sm prose-invert max-w-none text-[13px] text-indigo-100/80">
                  <ReactMarkdown>{aiSummary}</ReactMarkdown>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── COMMENTS SECTION ── */}
          <div className="mt-6">
            <div className="mb-4 flex items-center gap-6">
              <h2 className="text-lg font-semibold text-[var(--yt-fg)]">
                {active?.commentsCount || 0} Comments
              </h2>
              <button className="text-sm text-[var(--yt-muted)] hover:text-[var(--yt-hover-fg)] transition-colors">
                Sort by
              </button>
            </div>
            <div className="flex gap-3">
              {userImage ? (
                <img
                  src={userImage}
                  alt={userName || "You"}
                  className="h-9 w-9 shrink-0 rounded-full object-cover"
                />
              ) : (
                <div className="h-9 w-9 shrink-0 rounded-full bg-gradient-to-br from-pink-500 to-orange-500" />
              )}
              <input
                className="w-full border-b border-[var(--yt-border)] bg-transparent pb-2 text-sm text-[var(--yt-fg)] outline-none placeholder:text-[var(--yt-muted)] focus:border-[var(--yt-hover-border)] transition-colors"
                placeholder="Add a comment..."
              />
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════
            RIGHT COLUMN: Sidebar (Playlist)
        ════════════════════════════════════ */}
        <aside className="min-w-0 lg:sticky lg:top-[72px] lg:self-start">

          {/* ── CHIPS FILTER BAR ── */}
          <div className="mb-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {CHIPS.map((chip) => (
              <button
                key={chip}
                onClick={() => setActiveChip(chip)}
                className={cn(
                  "shrink-0 rounded-lg px-3 py-1.5 text-sm transition-colors",
                  activeChip === chip
                    ? "bg-[var(--yt-inverse-bg)] text-[var(--yt-inverse-fg)] font-medium"
                    : "bg-[var(--yt-surface)] text-[var(--yt-fg)] hover:bg-[var(--yt-surface-hover)]"
                )}
              >
                {chip}
              </button>
            ))}
          </div>

          {/* ── SIDEBAR HEADER ── */}
          <div className="mb-2 flex items-center justify-between px-1">
            <div className="flex items-center gap-2 text-xs text-[var(--yt-muted)]">
              <BookOpen className="h-3.5 w-3.5" />
              <span>{lectureTitle}</span>
            </div>
            <span className="text-[10px] font-semibold text-[var(--yt-muted)] uppercase tracking-wider">
              {filteredVideos.length} videos
            </span>
          </div>

          {/* ── VIDEO LIST (YouTube compact style) ── */}
          <ul className="flex flex-col gap-2">
            {filteredVideos.map((v, i) => {
              const isActive = v.id === activeId;
              const vYtId = extractYouTubeId(v.url);
              const thumbUrl = vYtId
                ? `https://i.ytimg.com/vi/${vYtId}/mqdefault.jpg`
                : null;

              return (
                <li key={v.id}>
                  <button
                    onClick={() => setActiveId(v.id)}
                    className={cn(
                      "flex w-full gap-2 rounded-xl p-1.5 text-left transition-colors",
                      isActive
                        ? "bg-[var(--yt-surface)]"
                        : "hover:bg-[var(--yt-surface-soft)]"
                    )}
                  >
                    {/* Thumbnail */}
                    <div className="relative aspect-video w-[168px] shrink-0 overflow-hidden rounded-lg bg-[var(--yt-surface)]">
                      {thumbUrl ? (
                        <img
                          src={thumbUrl}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">
                          <Video className="h-6 w-6 text-[var(--yt-muted)]" />
                        </div>
                      )}

                      {/* Playing overlay */}
                      {isActive && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <PlayingBars />
                        </div>
                      )}

                      {/* Duration / index badge */}
                      <span className="absolute bottom-1 right-1 rounded bg-black/85 px-1 py-0.5 text-[11px] font-medium text-white">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                    </div>

                    {/* Meta */}
                    <div className="flex-1 min-w-0 pr-1 pt-0.5">
                      <h3
                        className={cn(
                          "line-clamp-2 text-sm font-medium leading-snug",
                          isActive ? "text-[var(--yt-fg)]" : "text-[var(--yt-fg)]"
                        )}
                      >
                        {v.title}
                      </h3>
                      <div className="mt-1 flex items-center gap-1 text-xs text-[var(--yt-muted)]">
                        <span className="truncate">MedOneX Studio</span>
                        {v.likedByMe && (
                          <Heart className="h-3 w-3 shrink-0 fill-red-500 text-red-500" />
                        )}
                      </div>
                      <div className="text-xs text-[var(--yt-muted)]">
                        {v.likesCount > 0 && `${v.likesCount} likes`}
                      </div>
                    </div>

                    {/* More button */}
                    <button
                      className="h-6 w-6 shrink-0 rounded-full text-[var(--yt-muted)] hover:bg-[var(--yt-surface-hover)] hover:text-[var(--yt-hover-fg)] transition-colors self-start mt-1"
                      aria-label="More"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontal className="mx-auto h-4 w-4" />
                    </button>
                  </button>
                </li>
              );
            })}
          </ul>

          {/* ── BACK BUTTON (desktop sidebar) ── */}
          {hubUrl && (
            <div className="mt-6">
              <Link
                href={hubUrl}
                className="flex items-center gap-2 rounded-xl bg-[var(--yt-surface)] px-4 py-3 text-sm font-medium text-[var(--yt-fg)] hover:bg-[var(--yt-surface-hover)] transition-colors group"
              >
                <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
                Return to Lecture Sections
              </Link>
            </div>
          )}
        </aside>
      </div>

      {/* ── MOBILE FLOATING BACK BUTTON ── */}
      {hubUrl && (
        <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <Link
            href={hubUrl}
            className="flex items-center gap-2 rounded-full bg-[var(--yt-bg)]/90 backdrop-blur-xl border-[var(--yt-border)] shadow-xl px-6 py-2.5 text-xs font-bold text-[var(--yt-fg)] whitespace-nowrap active:scale-95 transition-all hover:bg-[var(--yt-surface)]"
          >
            <ChevronLeft className="h-4 w-4" />
            Lecture Sections
          </Link>
        </div>
      )}
    </div>
  );
}
