"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { enhancePlainImageUrls, normalizeImageUrl } from "@/lib/markdown-helpers";
import {
  Flame,
  MessageCircle,
  HelpCircle, BarChart3, Headphones, Link as LinkIcon,
} from "lucide-react";
import { ImageGallery } from "@/components/community/ImageGallery";
import { FileCard } from "@/components/community/FileCard";
import { FileIcon } from "@/components/community/FileIcon";
import { VideoThumbnail } from "@/components/community/VideoThumbnail";

/* ─────────────────────────────────────────────
   Meridian SVG Icon Components
───────────────────────────────────────────── */
function MeridianHeart({ filled, className }: { filled?: boolean; className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} className={className}>
      <path d="M20.8 8.6c0 4.8-8.8 10-8.8 10s-8.8-5.2-8.8-10a4.6 4.6 0 0 1 8.8-1.8A4.6 4.6 0 0 1 20.8 8.6Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    </svg>
  );
}

function MeridianComment({ className }: { className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M4 19V6A2 2 0 0 1 6 4H18A2 2 0 0 1 20 6V15A2 2 0 0 1 18 17H8L4 21V19Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    </svg>
  );
}

function MeridianBookmark({ filled, className }: { filled?: boolean; className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} className={className}>
      <path d="M6 3H18V21L12 17L6 21V3Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    </svg>
  );
}

function MeridianShare({ className }: { className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M4 12V19A2 2 0 0 0 6 21H18A2 2 0 0 0 20 19V12M16 6L12 2M12 2L8 6M12 2V15" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MeridianFile({ className }: { className?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M8 2H15L20 7V20A2 2 0 0 1 18 22H8A2 2 0 0 1 6 20V4A2 2 0 0 1 8 2Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M14 2V7H19" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

function MeridianLink({ className }: { className?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M9 15L15 9M11 6L11.5 5.5A3.5 3.5 0 1 1 16.5 10.5L14 13M13 18L12.5 18.5A3.5 3.5 0 1 1 7.5 13.5L10 11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ─────────────────────────────────────────────
   Types
───────────────────────────────────────────── */
interface PostAuthor {
  id: string;
  name: string;
  image: string | null;
  university?: string | null;
  rank?: { label?: string; badge?: string | null } | null;
}

interface PostData {
  id: string;
  content: string;
  imageUrl: string | null;
  attachments?: any;
  createdAt: string;
  author: PostAuthor;
  _count?: { likes: number; comments: number };
  sharedQuestion?: any;
  sharedQuestionData?: any;
  poll?: any;
  reactions?: { type: string; userId: string }[];
  category?: string;
  solved?: boolean;
  views?: number;
  bookmarkCount?: number;
  title?: string;
}

/* ─────────────────────────────────────────────
   Category color map (Meridian palette)
───────────────────────────────────────────── */
const CATEGORY_COLORS: Record<string, string> = {
  anatomy: "#7c9cf0",
  physiology: "#63b8b0",
  pharmacology: "#b58cf0",
  pathology: "#e0a15c",
  surgery: "#e07c7c",
  "internal-medicine": "#5cc2e0",
  "study-tips": "#a3c96a",
};

const CATEGORY_LABELS: Record<string, string> = {
  anatomy: "Anatomy",
  physiology: "Physiology",
  pharmacology: "Pharmacology",
  pathology: "Pathology",
  surgery: "Surgery",
  "internal-medicine": "Internal Medicine",
  "study-tips": "Study Tips",
};

function badgeColor(category?: string): string {
  return category && CATEGORY_COLORS[category] ? CATEGORY_COLORS[category] : "var(--primary)";
}

function categoryLabel(category?: string): string {
  return category && CATEGORY_LABELS[category] ? CATEGORY_LABELS[category] : "Community";
}

const CATEGORY_CLAMP: Record<string, number> = {
  announcement: 3,
  anatomy: 4,
  physiology: 4,
  pharmacology: 5,
  pathology: 5,
  surgery: 6,
  "internal-medicine": 6,
  "study-tips": 8,
};

function clampForCategory(category?: string): string {
  const n = category ? CATEGORY_CLAMP[category] ?? 4 : 4;
  return `line-clamp-${n}`;
}

/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */
function timeAgo(dateStr: string): string {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return new Date(dateStr).toLocaleDateString();
}

function parseAttachments(raw: any): any[] {
  if (!raw) return [];
  if (typeof raw === "string") {
    try {
      const p = JSON.parse(raw);
      return Array.isArray(p) ? p : p ? [p] : [];
    } catch {
      return [];
    }
  }
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "object" && raw.url) return [raw];
  if (typeof raw === "object") return Object.values(raw).filter((v: any) => v && typeof v === "object");
  return [];
}

function detectMediaType(url: string, name?: string): string {
  const imageExt = /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)(\?.*)?$/i;
  const videoExt = /\.(mp4|webm|mov|avi|mkv)(\?.*)?$/i;
  const audioExt = /\.(mp3|wav|ogg|aac|flac|m4a)(\?.*)?$/i;

  const check = (s: string) => {
    if (imageExt.test(s)) return "image";
    if (videoExt.test(s)) return "video";
    if (audioExt.test(s)) return "audio";
    return null;
  };

  if (url) {
    const r = check(url);
    if (r) return r;
    if (url.includes("youtube.com") || url.includes("youtu.be") || url.includes("t.me") || url.includes("telegram.me"))
      return "video";
  }

  if (name) {
    const r = check(name);
    if (r) return r;
  }

  return "file";
}

function extractYouTubeId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  return match ? match[1] : null;
}

function stripHandledUrls(text: string): string {
  if (!text) return text;
  return text
    .replace(/(https?:\/\/(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)[a-zA-Z0-9_-]{11})/gi, "")
    .replace(/https?:\/\/(?:www\.)?(?:t\.me|telegram\.me)\/[a-zA-Z0-9_]+\/\d+/gi, "")
    .replace(/https?:\/\/[^\s]+\.(mp4|webm|mov|avi|mkv|mp3|wav|ogg|aac|flac|m4a)(\?[^\s]*)?/gi, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n.charAt(0).toUpperCase())
    .join("");
}

function extractHashtags(text: string): string[] {
  if (!text) return [];
  const matches = text.match(/#[a-zA-Z0-9_\u0600-\u06FF]+/g);
  return matches ? [...new Set(matches.map(t => t.slice(1)))] : [];
}

function extractTitle(content: string): string {
  if (!content) return "";
  const stripped = content.replace(/<[^>]+>/g, "").trim();
  const firstLine = stripped.split("\n")[0];
  return firstLine.length > 80 ? firstLine.slice(0, 77) + "..." : firstLine;
}

function extractExternalLinks(text: string): string[] {
  if (!text) return [];
  const urlRegex = /https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi;
  const matches = text.match(urlRegex) || [];
  return matches.filter(url => {
    if (extractYouTubeId(url)) return false;
    if (url.match(/t\.me|telegram\.me|\.mp4|\.webm|\.mov|\.mp3|\.wav|\.ogg/i)) return false;
    return true;
  });
}

function formatCount(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(n % 1000 >= 100 ? 1 : 0) + "k";
  return String(n);
}

const RANK_COLORS: Record<string, string> = {
  Newbie: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  Active: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  Contributor: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  Expert: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  Elite: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const AVATAR_GRADIENTS = [
  "from-violet-500 to-indigo-500",
  "from-rose-500 to-pink-500",
  "from-amber-500 to-orange-500",
  "from-sky-500 to-indigo-500",
  "from-sky-500 to-blue-500",
  "from-fuchsia-500 to-purple-500",
];

function getAvatarGradient(name: string): string {
  const idx = name.charCodeAt(0) % AVATAR_GRADIENTS.length;
  return AVATAR_GRADIENTS[idx];
}

/* ─────────────────────────────────────────────
   Lightbox Component
───────────────────────────────────────────── */
/* ─────────────────────────────────────────────
   Skeleton Card (Meridian style)
───────────────────────────────────────────── */
function SkeletonCard({ compact }: { compact?: boolean }) {
  if (compact) {
    return (
      <div className="w-[240px] h-[130px] shrink-0 rounded-[18px] border border-border/30 bg-card/50 overflow-hidden animate-pulse p-4">
        <div className="flex items-start gap-3">
          <div className="h-7 w-7 rounded-full bg-muted/40 shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-24 rounded bg-muted/40" />
            <div className="h-2.5 w-full rounded bg-muted/30" />
          </div>
          <div className="flex gap-2">
            <div className="h-4 w-8 rounded bg-muted/30" />
            <div className="h-4 w-8 rounded bg-muted/30" />
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="sm:w-[340px] w-[260px] shrink-0 sm:h-[453px] h-[347px] rounded-2xl border border-border/30 bg-card/50 overflow-hidden animate-pulse">
      <div className="flex items-start gap-3 px-5 pt-5 pb-3.5">
        <div className="h-10 w-10 rounded-full bg-muted/40 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-3.5 w-28 rounded bg-muted/40" />
            <div className="h-5 w-14 rounded-full bg-muted/30" />
          </div>
          <div className="h-3 w-40 rounded bg-muted/30" />
        </div>
        <div className="h-6 w-20 rounded-full bg-muted/30 shrink-0" />
      </div>
      <div className="px-5 space-y-3">
        <div className="h-4 w-3/4 rounded bg-muted/30" />
        <div className="h-3 w-full rounded bg-muted/30" />
        <div className="h-3 w-5/6 rounded bg-muted/20" />
        <div className="h-3 w-2/3 rounded bg-muted/20" />
        <div className="h-3 w-4/5 rounded bg-muted/20" />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Poll Component
───────────────────────────────────────────── */
function PollBlock({ poll }: { poll: any }) {
  const [voted, setVoted] = useState<string | null>(null);

  const total = poll.options.reduce((a: number, o: any) => a + (o._count?.votes || 0), 0);

  return (
    <div className="shrink-0 rounded-xl border border-border/20 bg-gradient-to-br from-indigo-500/5 to-violet-500/5 p-3">
      <p className="text-[12px] font-bold text-foreground mb-2 leading-snug">{poll.question}</p>
      <div className="space-y-1.5">
        {poll.options?.slice(0, 4).map((opt: any) => {
          const pct = total === 0 ? 0 : Math.round(((opt._count?.votes || 0) / total) * 100);
          const isVoted = voted === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => setVoted(opt.id)}
              className={cn(
                "relative w-full h-7 rounded-lg overflow-hidden text-left transition-all",
                isVoted ? "ring-1 ring-indigo-500/50" : ""
              )}
            >
              <div
                className={cn(
                  "absolute inset-0 transition-all duration-700",
                  isVoted
                    ? "bg-indigo-500/25"
                    : "bg-muted/30 dark:bg-muted/20"
                )}
                style={{ width: voted ? `${Math.max(pct, 4)}%` : "100%" }}
              />
              <div className="relative flex items-center justify-between px-2.5 h-full">
                <span className="text-[10px] font-semibold text-foreground truncate">{opt.text}</span>
                {voted && (
                  <span className="text-[9px] font-black text-muted-foreground ml-1 shrink-0">{pct}%</span>
                )}
              </div>
            </button>
          );
        })}
        {poll.options?.length > 4 && (
          <p className="text-[9px] text-muted-foreground text-center pt-0.5">
            +{poll.options.length - 4} more options
          </p>
        )}
      </div>
      <p className="text-[9px] text-muted-foreground mt-2 text-left">
        {total.toLocaleString()} votes
      </p>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Post Card — Meridian Design (Exact Port)
───────────────────────────────────────────── */
function PostCard({
  post,
  isActive,
  index,
  compact,
}: {
  post: PostData;
  isActive: boolean;
  index: number;
  compact?: boolean;
}) {
  const [liked, setLiked] = useState(post.reactions?.some(r => r.type === "LIKE") ?? false);
  const [saved, setSaved] = useState(false);
  const [likeCount, setLikeCount] = useState(post._count?.likes ?? 0);
  const [bookmarkCount, setBookmarkCount] = useState(post.bookmarkCount ?? 0);
  const [ytPlaying, setYtPlaying] = useState(false);

  const title = post.title || extractTitle(post.content || "");
  const contentSrc = enhancePlainImageUrls(stripHandledUrls(post.content || ""));
  const attachments = useMemo(() => parseAttachments(post.attachments), [post.attachments]);
  const imageAttachments = attachments.filter((a: any) => a.type === "image" || detectMediaType(a.url || a, a.name) === "image");
  const videoAttachments = attachments.filter((a: any) => a.type === "video" || detectMediaType(a.url || a, a.name) === "video");
  const audioAttachments = attachments.filter((a: any) => a.type === "audio" || detectMediaType(a.url || a, a.name) === "audio");
  const fileAttachments = attachments.filter((a: any) => detectMediaType(a.url || a, a.name) === "file");

  const hashtags = useMemo(() => extractHashtags(post.content || ""), [post.content]);
  const externalLinks = useMemo(() => extractExternalLinks(post.content || ""), [post.content]);

  const category = post.category || "general";
  const catColor = badgeColor(category);
  const catLabel = categoryLabel(category);
  const solved = post.solved ?? false;
  const university = post.author?.university || undefined;
  const yearLabel = post.author?.rank?.label || undefined;

  const inlineYouTubeId = useMemo(() => {
    if (attachments.length > 0) return null;
    const match = post.content?.match(
      /(https?:\/\/(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)[a-zA-Z0-9_-]{11})/i
    );
    return match ? extractYouTubeId(match[1]) : null;
  }, [post.content, attachments]);

  const inlineTelegramUrl = useMemo(() => {
    if (attachments.length > 0) return null;
    const match = post.content?.match(
      /https?:\/\/(?:www\.)?(?:t\.me|telegram\.me)\/([a-zA-Z0-9_]+)\/(\d+)/i
    );
    return match ? match[0] : null;
  }, [post.content, attachments]);

  const sharedQuestion = useMemo(() => {
    if (post.sharedQuestion) return post.sharedQuestion;
    if (post.sharedQuestionData) {
      if (typeof post.sharedQuestionData === "string") {
        try {
          return JSON.parse(post.sharedQuestionData);
        } catch {
          return null;
        }
      }
      return post.sharedQuestionData;
    }
    return null;
  }, [post.sharedQuestion, post.sharedQuestionData]);

  const mediaItems = useMemo(() => {
    const items: { type: "image" | "video" | "file"; url: string; name?: string; size?: number }[] = [];
    const seen = new Set<string>();

    const add = (url: string, type: "image" | "video" | "file", extra?: { name?: string; size?: number }) => {
      const normalized = normalizeImageUrl(url);
      if (!normalized || seen.has(normalized)) return;
      seen.add(normalized);
      items.push({ type, url: normalized, ...extra });
    };

    if (post.imageUrl) add(post.imageUrl, "image");
    imageAttachments.forEach((a: any) => add(a.url || a, "image", { name: a.name || a.alt }));
    videoAttachments.forEach((a: any) => add(a.url || a, "video"));
    if (inlineYouTubeId) add(inlineYouTubeId, "video");
    if (inlineTelegramUrl) add(inlineTelegramUrl, "video");
    fileAttachments.forEach((a: any) => add(a.url || a, "file", { name: a.name || "File", size: a.size }));
    return items;
  }, [post.imageUrl, imageAttachments, videoAttachments, inlineYouTubeId, inlineTelegramUrl, fileAttachments]);

  const hasMedia = mediaItems.length > 0;
  const mediaOverflow = mediaItems.length > 3 ? mediaItems.length - 3 : 0;

  const avatarGrad = getAvatarGradient(post.author?.name || "?");
  const initials = getInitials(post.author?.name || "?");

  const handleLike = () => {
    setLiked((v) => !v);
    setLikeCount((c) => (liked ? c - 1 : c + 1));
  };

  const handleBookmark = () => {
    setSaved((v) => !v);
    setBookmarkCount((c) => (saved ? c - 1 : c + 1));
  };

  const cardRef = useRef<HTMLDivElement>(null);

  if (compact) {
    const preview = stripHandledUrls(post.content?.replace(/<[^>]*>/g, "") || "").slice(0, 120);
    return (
      <div ref={cardRef} dir="auto" className="w-[240px] h-[130px] shrink-0 rounded-[18px] border border-border/40 bg-card shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 flex flex-col p-4 overflow-hidden">
        <div className="flex items-start gap-2.5 shrink-0">
          <div className="relative shrink-0">
            {post.author?.image ? (
              <img src={post.author.image} alt={post.author.name} loading="lazy" className="h-7 w-7 rounded-full object-cover ring-2 ring-border/20" />
            ) : (
              <div className={cn("h-7 w-7 rounded-full bg-gradient-to-br flex items-center justify-center text-white text-[9px] font-bold ring-2 ring-white/10", avatarGrad)}>
                {initials}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-xs font-bold text-foreground truncate block">{post.author?.name || "Unknown"}</span>
            <span className="text-[9px] text-muted-foreground">{timeAgo(post.createdAt)}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={handleLike} className="flex items-center gap-1 text-muted-foreground hover:text-red-500 transition-colors">
              <MeridianHeart filled={liked} className="h-3.5 w-3.5" />
              {likeCount > 0 && <span className="text-[10px] font-bold">{formatCount(likeCount)}</span>}
            </button>
            <Link href="/social" className="flex items-center gap-1 text-muted-foreground hover:text-indigo-500 transition-colors">
              <MeridianComment className="h-3.5 w-3.5" />
              {post._count?.comments ? <span className="text-[10px] font-bold">{formatCount(post._count.comments)}</span> : null}
            </Link>
          </div>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-1 mt-2 flex-1">
          {preview || "No content"}
        </p>
        <Link href={`/social?post=${post.id}`} className="text-[9px] font-bold text-indigo-500 hover:text-indigo-400 transition-colors mt-auto">
          Read more →
        </Link>
      </div>
    );
  }

  return (
    <>
      <div
        ref={cardRef}
        dir="auto"
        className="group sm:w-[340px] w-[300px] shrink-0 rounded-2xl border border-border/40 bg-card shadow-lg shadow-black/5 dark:shadow-black/20 hover:-translate-y-0.5 hover:shadow-xl hover:border-border/60 transition-all duration-200 flex flex-col p-5 gap-4 sm:h-[453px] sm:min-h-[453px] sm:max-h-[453px] h-[400px] min-h-[400px] max-h-[400px] overflow-hidden dark:bg-[#14141B]/70 dark:backdrop-blur-xl dark:border-white/[0.06]"
      >
        {/* ── Header: Author + Solved Badge + Category Badge ── */}
        <div className="relative shrink-0 flex items-start gap-3 z-10">
          {/* Avatar */}
          <div className="relative shrink-0">
            {post.author?.image ? (
              <img
                src={post.author.image}
                alt={post.author.name}
                loading="lazy"
                className="h-10 w-10 rounded-full object-cover ring-2 ring-border/20"
              />
            ) : (
              <div
                className={cn(
                  "h-10 w-10 rounded-full bg-gradient-to-br flex items-center justify-center text-white text-[11px] font-bold ring-2 ring-white/10",
                  avatarGrad
                )}
              >
                {initials}
              </div>
            )}
          </div>

          {/* Author info */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-sm font-bold text-foreground truncate">
                {post.author?.name || "Unknown"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              {university && <span>{university}</span>}
              {(university || yearLabel) && <span> · </span>}
              <span>{timeAgo(post.createdAt)}</span>
            </p>
          </div>

          {/* Rank badge */}
          <span
            className={cn(
              "shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full leading-none",
              yearLabel && RANK_COLORS[yearLabel]
                ? RANK_COLORS[yearLabel]
                : solved
                  ? "bg-emerald-500/10 text-emerald-500"
                  : "bg-amber-500/10 text-amber-500"
            )}
          >
            {yearLabel || (solved ? "Solved" : "Open")}
          </span>
        </div>

        {/* ── Body ── */}
        <div className="relative w-full flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="flex flex-col gap-1.5 h-full">
            {/* Title */}
            {title && (
              <h3 dir="auto" className="shrink-0 font-semibold text-foreground cursor-pointer hover:text-primary transition-colors m-0"
                style={{ fontFamily: "'Source Serif 4', var(--font-vazirmatn), Georgia, serif", fontSize: "clamp(16px, 1.6vw, 19px)" }}>
                {title}
              </h3>
            )}

            {/* Preview - 2 lines, always */}
            {contentSrc && (
              isActive ? (
                <p dir="auto" className="shrink-0 text-xs text-muted-foreground leading-relaxed line-clamp-2">
                  {stripHandledUrls(post.content?.replace(/<[^>]*>/g, "") || "").slice(0, 200)}
                </p>
              ) : (
                <p dir="auto" className={cn("shrink-0 text-[12px] text-muted-foreground leading-relaxed", clampForCategory(category))} style={{ fontFamily: "var(--font-nunito), var(--font-vazirmatn), sans-serif" }}>
                  {stripHandledUrls(post.content?.replace(/<[^>]*>/g, "") || "").slice(0, 200) || "No content"}
                </p>
              )
            )}

            {/* Indicators */}
            <div className="shrink-0 flex flex-wrap gap-x-3 gap-y-0.5">
              {sharedQuestion && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-500">
                  <HelpCircle className="h-3.5 w-3.5" /> Question
                </span>
              )}
              {post.poll && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-500">
                  <BarChart3 className="h-3.5 w-3.5" /> Poll
                </span>
              )}
              {audioAttachments.length > 0 && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-cyan-500">
                  <Headphones className="h-3.5 w-3.5" /> {audioAttachments.length} Audio
                </span>
              )}
              {externalLinks.length > 0 && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-500">
                  <LinkIcon className="h-3.5 w-3.5" /> {externalLinks.length} Link{externalLinks.length !== 1 ? "s" : ""}
                </span>
              )}
              {fileAttachments.length > 0 && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-violet-500">
                  <FileIcon fileName={fileAttachments[0]?.name || "file"} /> {fileAttachments.length} file{fileAttachments.length !== 1 ? "s" : ""}
                </span>
              )}
              {mediaOverflow > 0 && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground">
                  +{mediaOverflow} more
                </span>
              )}
            </div>

            {/* Tags */}
            {hashtags.length > 0 && (
              <div className="shrink-0 flex flex-wrap gap-1.5">
                {hashtags.slice(0, 6).map((tag, i) => (
                  <span key={i}
                    className="inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Media section — unified view, max 3 items */}
            {hasMedia && (
              <div className="w-full mt-auto pt-2 flex gap-[2px] rounded-lg overflow-hidden" style={{ height: "85px" }}>
                {mediaItems.slice(0, 3).map((item, i) => {
                  const isOverflow = i === 2 && mediaOverflow > 0;
                  return (
                    <div
                      key={i}
                      className="relative flex-1 min-w-0 overflow-hidden rounded-md bg-muted/20"
                      onClick={() => window.open(`/social?post=${post.id}`, "_self")}
                    >
                      {item.type === "image" ? (
                        <img
                          src={item.url}
                          alt={item.name || ""}
                          loading="lazy"
                          className="w-full h-full object-contain"
                        />
                      ) : item.type === "video" ? (
                        <VideoThumbnail url={item.url} className="w-full h-full" />
                      ) : (
                        <FileCard
                          fileName={item.name || "File"}
                          fileSize={item.size != null ? String(item.size) : undefined}
                          className="w-full h-full"
                        />
                      )}
                      {isOverflow && (
                        <div className="absolute inset-0 bg-black/55 flex items-center justify-center rounded-md">
                          <span className="text-white text-lg font-bold">+{mediaOverflow}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Footer (Meridian style) ── */}
        <div className="relative shrink-0 pt-4 mt-auto border-t border-border/10 z-10">
          <div className="flex items-center gap-1">
            {/* Like */}
            <button
              onClick={handleLike}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all active:scale-90",
                liked ? "text-red-500" : "text-muted-foreground hover:text-red-500 hover:bg-red-500/8"
              )}
            >
              <MeridianHeart filled={liked} className="h-4 w-4" />
              <span>{likeCount > 0 ? formatCount(likeCount) : ""}</span>
            </button>

            {/* Comments */}
            <Link
              href="/social"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-indigo-500 hover:bg-indigo-500/8 transition-all"
            >
              <MeridianComment className="h-4 w-4" />
              <span>{post._count?.comments ? formatCount(post._count.comments) : ""}</span>
            </Link>

            {/* Bookmark */}
            <button
              onClick={handleBookmark}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all active:scale-90",
                saved ? "text-primary" : "text-muted-foreground hover:text-primary hover:bg-primary/8"
              )}
            >
              <MeridianBookmark filled={saved} className="h-4 w-4" />
              <span>{bookmarkCount > 0 ? formatCount(bookmarkCount) : ""}</span>
            </button>

            {/* Share */}
            <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-sky-500 hover:bg-sky-500/8 transition-all active:scale-90">
              <MeridianShare className="h-4 w-4" />
            </button>

            {/* Spacer + Read more */}
            <div className="flex-1" />
            {contentSrc && (
              <Link
                href={`/social?post=${post.id}`}
                className="text-xs font-semibold text-indigo-500 hover:text-indigo-400 transition-colors"
              >
                Read more
              </Link>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────
   Main Carousel
───────────────────────────────────────────── */
export function CommunityPostsCarousel({ variant, maxPosts }: { variant?: "default" | "compact"; maxPosts?: number } = {}) {
  const [posts, setPosts] = useState<PostData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const isCompact = variant === "compact";
  const limit = maxPosts ?? (isCompact ? 5 : 6);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/v1/community/posts?limit=12");
        if (!res.ok) throw new Error();
        const data = await res.json();
        const body = (data as any)?.data ?? data;
        if (!cancelled) setPosts(Array.isArray(body.items) ? body.items : []);
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="section-entrance">
      <div className="flex items-center gap-2 mb-5 pt-5 pl-5">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10">
            <MessageCircle className="h-3 w-3 text-primary" />
            <span className="text-[10px] font-black uppercase tracking-wider text-primary">Community</span>
          </span>
        </div>
        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 pl-5">
          <SkeletonCard compact={isCompact} />
          <SkeletonCard compact={isCompact} />
        </div>
      </div>
    );
  }

  if (error || posts.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="section-entrance"
    >
      {/* Community heading */}
        <div className="flex items-center gap-2 mb-5 pt-5 pl-5">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10">
          <MessageCircle className="h-3 w-3 text-primary" />
          <span className="text-[10px] font-black uppercase tracking-wider text-primary">Community</span>
        </span>
      </div>

      {/* Horizontal scroll of post cards */}
        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 pl-5">
        {posts.slice(0, limit).map((post, idx) => (
          <PostCard
            key={post.id}
            post={post}
            isActive={true}
            index={idx}
            compact={isCompact}
          />
        ))}
      </div>
    </motion.div>
  );
}
