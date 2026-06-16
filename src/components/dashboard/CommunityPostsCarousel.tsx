"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { markdownComponentsWithImages } from "@/components/ui/markdown-components";
import { enhancePlainImageUrls } from "@/lib/markdown-helpers";
import { cn } from "@/lib/utils";
import { SharedQuestionBlock } from "@/components/quiz/SharedQuestionBlock";
import { VidStackPlayer } from "@/components/content/VidStackPlayer";
import {
  ArrowRightIcon,
  PaperClipIcon,
  ArrowsPointingOutIcon,
  HeartIcon,
  ChatBubbleLeftIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PlayIcon,
  UserGroupIcon,
} from "@heroicons/react/24/solid";
import {
  HeartIcon as HeartOutlineIcon,
  ShareIcon,
  BookmarkIcon,
} from "@heroicons/react/24/outline";

/* ─────────────────────────────────────────────
   Types
───────────────────────────────────────────── */
interface PostAuthor {
  id: string;
  name: string;
  image: string | null;
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

function detectMediaType(url: string): string {
  if (!url) return "file";
  const u = url.toLowerCase();
  if (u.match(/\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)(\?.*)?$/)) return "image";
  if (u.match(/\.(mp4|webm|mov|avi|mkv)(\?.*)?$/)) return "video";
  if (u.match(/\.(mp3|wav|ogg|aac|flac|m4a)(\?.*)?$/)) return "audio";
  if (u.includes("youtube.com") || u.includes("youtu.be") || u.includes("t.me") || u.includes("telegram.me"))
    return "video";
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

const AVATAR_GRADIENTS = [
  "from-violet-500 to-indigo-500",
  "from-rose-500 to-pink-500",
  "from-amber-500 to-orange-500",
  "from-emerald-500 to-teal-500",
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
function Lightbox({
  images,
  startIdx,
  onClose,
}: {
  images: { url: string; alt?: string }[];
  startIdx: number;
  onClose: () => void;
}) {
  const [idx, setIdx] = useState(startIdx);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") setIdx((i) => Math.max(0, i - 1));
      if (e.key === "ArrowRight") setIdx((i) => Math.min(images.length - 1, i + 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [images.length, onClose]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
        onClick={onClose}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 h-10 w-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/20 transition-all"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>

        {/* Counter */}
        {images.length > 1 && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm text-white text-xs font-bold">
            {idx + 1} / {images.length}
          </div>
        )}

        {/* Prev */}
        {idx > 0 && (
          <button
            onClick={(e) => { e.stopPropagation(); setIdx((i) => i - 1); }}
            className="absolute left-4 h-10 w-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/20 transition-all"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
        )}

        {/* Image */}
        <motion.img
          key={idx}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
          src={images[idx].url}
          alt={images[idx].alt || ""}
          className="max-h-[90vh] max-w-[90vw] rounded-xl object-contain"
          onClick={(e) => e.stopPropagation()}
        />

        {/* Next */}
        {idx < images.length - 1 && (
          <button
            onClick={(e) => { e.stopPropagation(); setIdx((i) => i + 1); }}
            className="absolute right-4 h-10 w-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/20 transition-all"
          >
            <ChevronRightIcon className="h-5 w-5" />
          </button>
        )}

        {/* Thumbnails strip */}
        {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 px-3 py-2 rounded-xl bg-white/10 backdrop-blur-sm">
            {images.map((img, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); setIdx(i); }}
                className={cn(
                  "h-10 w-10 rounded-lg overflow-hidden border-2 transition-all",
                  i === idx ? "border-white scale-110" : "border-transparent opacity-50 hover:opacity-80"
                )}
              >
                <img src={img.url} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

/* ─────────────────────────────────────────────
   Skeleton Card
───────────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div className="w-full h-[380px] rounded-2xl border border-border/30 bg-card/50 overflow-hidden animate-pulse">
      <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-border/10">
        <div className="h-9 w-9 rounded-full bg-muted/40" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3 w-24 rounded bg-muted/40" />
          <div className="h-2 w-16 rounded bg-muted/30" />
        </div>
      </div>
      <div className="p-4 space-y-3">
        <div className="h-3 w-full rounded bg-muted/30" />
        <div className="h-3 w-4/5 rounded bg-muted/30" />
        <div className="h-3 w-3/5 rounded bg-muted/20" />
        <div className="h-40 w-full rounded-xl bg-muted/20 mt-4" />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Image Grid
───────────────────────────────────────────── */
function ImageGrid({
  images,
  onOpen,
}: {
  images: { url: string; alt?: string }[];
  onOpen: (i: number) => void;
}) {
  if (images.length === 0) return null;

  if (images.length === 1) {
    return (
      <div
        className="shrink-0 rounded-xl overflow-hidden cursor-pointer group relative"
        onClick={() => onOpen(0)}
      >
        <img
          src={images[0].url}
          alt={images[0].alt || ""}
          className="w-full h-52 object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <div className="h-10 w-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <ArrowsPointingOutIcon className="h-5 w-5 text-white" />
          </div>
        </div>
      </div>
    );
  }

  if (images.length === 2) {
    return (
      <div className="shrink-0 grid grid-cols-2 gap-1.5 rounded-xl overflow-hidden">
        {images.map((img, i) => (
          <div
            key={i}
            className="cursor-pointer group relative overflow-hidden rounded-lg"
            onClick={() => onOpen(i)}
          >
            <img
              src={img.url}
              alt={img.alt || ""}
              className="h-44 w-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-all duration-300" />
          </div>
        ))}
      </div>
    );
  }

  if (images.length === 3) {
    return (
      <div className="shrink-0 grid grid-cols-3 gap-1.5 rounded-xl overflow-hidden">
        <div
          className="cursor-pointer group relative overflow-hidden rounded-lg col-span-2"
          onClick={() => onOpen(0)}
        >
          <img
            src={images[0].url}
            alt={images[0].alt || ""}
            className="h-44 w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-all duration-300" />
        </div>
        <div className="grid grid-rows-2 gap-1.5">
          {images.slice(1, 3).map((img, i) => (
            <div
              key={i}
              className="cursor-pointer group relative overflow-hidden rounded-lg"
              onClick={() => onOpen(i + 1)}
            >
              <img
                src={img.url}
                alt={img.alt || ""}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-all duration-300" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="shrink-0 grid grid-cols-3 gap-1.5 rounded-xl overflow-hidden">
      {images.slice(0, 4).map((img, i) => (
        <div
          key={i}
          className={cn(
            "cursor-pointer group relative overflow-hidden rounded-lg",
            i === 0 ? "col-span-2 row-span-2" : ""
          )}
          onClick={() => onOpen(i)}
        >
          <img
            src={img.url}
            alt={img.alt || ""}
            className={cn(
              "w-full object-cover transition-transform duration-500 group-hover:scale-105",
              i === 0 ? "h-44" : "h-20"
            )}
            loading="lazy"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-all duration-300" />
          {i === 3 && images.length > 4 && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-[1px]">
              <span className="text-white font-black text-xl">+{images.length - 4}</span>
            </div>
          )}
        </div>
      ))}
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
                <span className="text-[10px] font-semibold text-foreground/80 truncate">{opt.text}</span>
                {voted && (
                  <span className="text-[9px] font-black text-muted-foreground/70 ml-1 shrink-0">{pct}%</span>
                )}
              </div>
            </button>
          );
        })}
        {poll.options?.length > 4 && (
          <p className="text-[9px] text-muted-foreground/50 text-center pt-0.5">
            +{poll.options.length - 4} more options
          </p>
        )}
      </div>
      <p className="text-[9px] text-muted-foreground/40 mt-2 text-left">
        {total.toLocaleString()} votes
      </p>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Post Card
───────────────────────────────────────────── */
function PostCard({
  post,
  isActive,
  index,
  onSwipeLeft,
  onSwipeRight,
  onSwiping,
}: {
  post: PostData;
  isActive: boolean;
  index: number;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwiping?: (dx: number) => void;
}) {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [likeCount, setLikeCount] = useState(post._count?.likes ?? 0);
  const [ytPlaying, setYtPlaying] = useState(false);

  const contentSrc = enhancePlainImageUrls(stripHandledUrls(post.content || ""));
  const attachments = useMemo(() => parseAttachments(post.attachments), [post.attachments]);
  const imageAttachments = attachments.filter((a: any) => detectMediaType(a.url || a) === "image");
  const videoAttachments = attachments.filter((a: any) => detectMediaType(a.url || a) === "video");
  const audioAttachments = attachments.filter((a: any) => detectMediaType(a.url || a) === "audio");
  const fileAttachments = attachments.filter((a: any) => detectMediaType(a.url || a) === "file");

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

  const allImages = useMemo(() => {
    const imgs: { url: string; alt?: string }[] = [];
    if (post.imageUrl) imgs.push({ url: post.imageUrl });
    imageAttachments.forEach((a: any) => imgs.push({ url: a.url || a, alt: a.name || a.alt }));
    return imgs;
  }, [post.imageUrl, imageAttachments]);

  const mainVideoUrl =
    videoAttachments.length > 0 ? videoAttachments[0].url || videoAttachments[0] : null;

  const avatarGrad = getAvatarGradient(post.author?.name || "?");
  const initials = getInitials(post.author?.name || "?");

  const handleLike = () => {
    setLiked((v) => !v);
    setLikeCount((c) => (liked ? c - 1 : c + 1));
  };

  /* ─── Swipe handlers ─── */
  const cardRef = useRef<HTMLDivElement>(null);
  const swipeState = useRef({ startX: 0, dx: 0, el: null as HTMLDivElement | null, active: false });

  const handleSwipeDown = (e: React.PointerEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest("button,a,input,audio,video,[role='button'],textarea")) return;
    const el = e.currentTarget as HTMLDivElement;
    el.setPointerCapture(e.pointerId);
    el.style.transition = "none";
    el.style.willChange = "transform";
    swipeState.current = { startX: e.clientX, dx: 0, el, active: true };
  };

  const handleSwipeMove = (e: React.PointerEvent) => {
    const s = swipeState.current;
    if (!s.active || !s.el) return;
    s.dx = e.clientX - s.startX;
    const rotate = s.dx * 0.03;
    s.el.style.transform = `translateX(${s.dx}px) rotate(${Math.max(-8, Math.min(8, rotate))}deg)`;
    onSwiping?.(s.dx);
  };

  const handleSwipeUp = (e: React.PointerEvent) => {
    const s = swipeState.current;
    if (!s.active || !s.el) { swipeState.current = { startX: 0, dx: 0, el: null, active: false }; return; }
    s.active = false;
    const dx = s.dx;
    const el = s.el;
    el.style.transition = "transform 0.4s cubic-bezier(0.22, 1, 0.36, 1)";
    if (dx > 80 && onSwipeRight) {
      el.style.transform = "translateX(400px) rotate(8deg)";
      el.style.opacity = "0";
      setTimeout(() => { onSwipeRight?.(); onSwiping?.(0); }, 200);
    } else if (dx < -80 && onSwipeLeft) {
      el.style.transform = "translateX(-400px) rotate(-8deg)";
      el.style.opacity = "0";
      setTimeout(() => { onSwipeLeft?.(); onSwiping?.(0); }, 200);
    } else {
      el.style.transform = "translateX(0) rotate(0deg)";
      el.style.opacity = "1";
      onSwiping?.(0);
    }
    swipeState.current = { startX: 0, dx: 0, el: null, active: false };
  };

  const swipeHandlers = onSwipeLeft || onSwipeRight ? {
    onPointerDown: handleSwipeDown,
    onPointerMove: handleSwipeMove,
    onPointerUp: handleSwipeUp,
    onPointerCancel: handleSwipeUp,
  } : {};

  return (
    <>
      {lightboxIdx !== null && (
        <Lightbox
          images={allImages}
          startIdx={lightboxIdx}
          onClose={() => setLightboxIdx(null)}
        />
      )}

      <div
        ref={cardRef}
        className="w-full rounded-2xl border overflow-hidden flex flex-col relative bg-card shadow-lg shadow-black/5 dark:shadow-black/20"
        {...swipeHandlers}
        style={{
          height: "380px",
          touchAction: "pan-y",
          cursor: "grab",
          userSelect: "none",
          WebkitUserSelect: "none",
        }}
      >
        {/* Logo watermark — structural part of the card */}
        <div
          className="absolute -bottom-24 bg-foreground/[0.06] dark:bg-foreground/[0.04] pointer-events-none select-none"
            style={{
              width: 360,
              height: 360,
              right: -120,
            maskImage: "url(/medonex-logo.svg)",
            maskSize: "contain",
            maskRepeat: "no-repeat",
            maskPosition: "center",
            WebkitMaskImage: "url(/medonex-logo.svg)",
            WebkitMaskSize: "contain",
            WebkitMaskRepeat: "no-repeat",
            WebkitMaskPosition: "center",
          }}
        />

        {/* ── Header ── */}
        <div className="flex items-center gap-3 px-4 pt-3.5 pb-3 border-b border-border/10 shrink-0">
          {/* Avatar */}
          <div className="relative shrink-0">
            {post.author?.image ? (
              <img
                src={post.author.image}
                alt={post.author.name}
                className="h-9 w-9 rounded-full object-cover ring-2 ring-border/20"
              />
            ) : (
              <div
                className={cn(
                  "h-9 w-9 rounded-full bg-gradient-to-br flex items-center justify-center text-white text-[11px] font-black ring-2 ring-white/10",
                  avatarGrad
                )}
              >
                {initials}
              </div>
            )}
            {/* Online dot */}
            <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 border-2 border-card" />
          </div>

          {/* Author info */}
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-bold text-foreground truncate leading-tight">
              {post.author?.name || "Unknown"}
            </p>
            <p className="text-[10px] text-muted-foreground/60 leading-tight">
              {timeAgo(post.createdAt)}
            </p>
          </div>

          {/* Save button */}
          <button
            onClick={() => setSaved((v) => !v)}
            className={cn(
              "h-8 w-8 rounded-lg flex items-center justify-center transition-all active:scale-90",
              saved
                ? "bg-amber-500/15 text-amber-500"
                : "bg-muted/20 text-muted-foreground/50 hover:text-amber-500 hover:bg-amber-500/10"
            )}
          >
            <BookmarkIcon className="h-4 w-4" />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2.5 scrollbar-thin scrollbar-thumb-border/30 scrollbar-track-transparent w-full" style={{ maxWidth: "100%" }}>
          {isActive ? (
            <>
              {/* Text */}
              {contentSrc && (
                <div className="text-[13px] leading-[1.8] text-foreground/90 break-words overflow-x-hidden [&_img]:max-h-[80px] [&_img]:rounded-lg [&_img]:object-cover [&_img]:mt-1 [&_p]:mb-1.5 [&_p]:leading-relaxed [&_a]:text-indigo-500 [&_a]:font-medium [&_strong]:font-bold">
                  <ReactMarkdown components={markdownComponentsWithImages}>
                    {contentSrc}
                  </ReactMarkdown>
                </div>
              )}

              {/* YouTube — thumbnail + play overlay */}
              {inlineYouTubeId && (
                ytPlaying ? (
                  <div className="shrink-0 rounded-xl overflow-hidden border border-indigo-500/20 bg-gradient-to-br from-indigo-500/[0.04] to-violet-500/[0.04]">
                    <div className="flex items-center gap-2 px-3 py-2 border-b border-indigo-500/10">
                      <PlayIcon className="h-3 w-3 text-indigo-500" />
                      <span className="text-[9px] font-black text-indigo-500 uppercase tracking-[0.15em]">Playing</span>
                    </div>
                    <div className="aspect-video bg-black">
                      <VidStackPlayer url={`https://www.youtube.com/watch?v=${inlineYouTubeId}`} />
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => setYtPlaying(true)}
                    className="shrink-0 rounded-xl overflow-hidden aspect-video bg-muted/20 ring-1 ring-border/20 relative cursor-pointer group"
                  >
                    <img
                      src={`https://img.youtube.com/vi/${inlineYouTubeId}/maxresdefault.jpg`}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="h-14 w-14 rounded-full bg-white/90 shadow-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <PlayIcon className="h-6 w-6 text-foreground ml-0.5" />
                      </div>
                    </div>
                    <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/50 backdrop-blur-sm text-[9px] font-bold text-white/80">
                      Video
                    </div>
                  </div>
                )
              )}

              {/* Telegram */}
              {inlineTelegramUrl && (
                <div className="shrink-0 rounded-xl overflow-hidden aspect-video bg-muted/20 ring-1 ring-border/20">
                  <VidStackPlayer url={inlineTelegramUrl} />
                </div>
              )}

              {/* Video attachment */}
              {mainVideoUrl && (
                <div className="shrink-0 rounded-xl overflow-hidden aspect-video bg-muted/20 ring-1 ring-border/20">
                  <VidStackPlayer url={mainVideoUrl} />
                </div>
              )}

              {/* Images */}
              <ImageGrid images={allImages} onOpen={setLightboxIdx} />

              {/* Poll */}
              {post.poll && <PollBlock poll={post.poll} />}

              {/* Shared question */}
              {sharedQuestion && (
                <div className="shrink-0 max-h-[90px] overflow-hidden rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-3">
                  <SharedQuestionBlock question={sharedQuestion} />
                </div>
              )}

              {/* Audio */}
              {audioAttachments.length > 0 && (
                <div className="shrink-0 space-y-1.5">
                  {audioAttachments.slice(0, 2).map((a: any, i: number) => (
                    <div
                      key={i}
                      className="rounded-xl bg-emerald-500/8 border border-emerald-500/15 p-2.5"
                    >
                      <audio controls className="w-full h-8" src={a.url || a}>
                        Your browser does not support audio.
                      </audio>
                    </div>
                  ))}
                </div>
              )}

              {/* Files */}
              {fileAttachments.length > 0 && (
                <div className="shrink-0 space-y-1.5">
                  {fileAttachments.slice(0, 3).map((a: any, i: number) => {
                    const fileName =
                      a.name || a.fileName || a.url?.split("/").pop() || `file-${i + 1}`;
                    return (
                      <a
                        key={i}
                        href={a.url || a}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2.5 p-2.5 rounded-xl bg-amber-500/8 border border-amber-500/15 hover:bg-amber-500/15 transition-all group"
                      >
                        <PaperClipIcon className="h-4 w-4 text-amber-500 shrink-0" />
                        <span className="text-[11px] font-medium text-foreground/70 truncate flex-1">
                          {fileName}
                        </span>
                        <ArrowRightIcon className="h-3 w-3 text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 rotate-[-45deg]" />
                      </a>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            /* Non-active: show plain preview */
            <p className="text-[12px] text-muted-foreground/60 leading-relaxed line-clamp-8">
              {stripHandledUrls(post.content?.replace(/<[^>]*>/g, "") || "").slice(0, 200) ||
                "No content"}
            </p>
          )}
        </div>

        {/* ── Footer Actions ── */}
        <div className="shrink-0 px-4 pb-3 pt-2 border-t border-border/10">
          <div className="flex items-center gap-1">
            {/* Like */}
            <button
              onClick={handleLike}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all active:scale-90",
                liked
                  ? "text-rose-500 bg-rose-500/10"
                  : "text-muted-foreground/50 hover:text-rose-500 hover:bg-rose-500/8"
              )}
            >
              {liked ? (
                <HeartIcon className="h-4 w-4" />
              ) : (
                <HeartOutlineIcon className="h-4 w-4" />
              )}
              <span>{likeCount > 0 ? likeCount.toLocaleString() : ""}</span>
            </button>

            {/* Comments */}
            <Link
              href="/social"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-muted-foreground/50 hover:text-indigo-500 hover:bg-indigo-500/8 transition-all"
            >
              <ChatBubbleLeftIcon className="h-4 w-4" />
              <span>{post._count?.comments ? post._count.comments.toLocaleString() : ""}</span>
            </Link>

            {/* Share */}
            <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-muted-foreground/50 hover:text-sky-500 hover:bg-sky-500/8 transition-all active:scale-90">
              <ShareIcon className="h-4 w-4" />
            </button>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Read more */}
            <Link
              href="/social"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-wider hover:bg-indigo-500/20 active:scale-95 transition-all"
            >
              Read more
              <ArrowRightIcon className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────
   Main Carousel
───────────────────────────────────────────── */
export function CommunityPostsCarousel() {
  const [posts, setPosts] = useState<PostData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const [swipeDx, setSwipeDx] = useState(0);

  const nextPost = activeIdx < posts.length - 1 ? posts[activeIdx + 1] : null;
  const prevPost = activeIdx > 0 ? posts[activeIdx - 1] : null;

  const nextProgress = nextPost ? Math.max(0, Math.min(1, -swipeDx / 200)) : 0;
  const prevProgress = prevPost ? Math.max(0, Math.min(1, swipeDx / 200)) : 0;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const forumRes = await fetch("/api/v1/forums?type=GLOBAL");
        if (!forumRes.ok) throw new Error();
        const forums = await forumRes.json();
        const gf = Array.isArray(forums) ? forums.find((f: any) => f.type === "GLOBAL") : null;
        if (!gf) throw new Error();

        const postsRes = await fetch(`/api/v1/forums/${gf.id}/posts?page=1&limit=12`);
        if (!postsRes.ok) throw new Error();
        const data = await postsRes.json();
        const raw = data.posts || data || [];
        if (!cancelled) setPosts(Array.isArray(raw) ? raw : []);
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
      <div className="px-4 pt-2">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-4 w-4 rounded bg-muted/30 animate-pulse" />
          <div className="h-3 w-16 rounded bg-muted/30 animate-pulse" />
        </div>
        <div className="relative" style={{ minHeight: 400 }}>
          <div className="absolute inset-0 rounded-2xl border border-border/30 bg-card/40 overflow-hidden animate-pulse" style={{ zIndex: 2 }} />
          <div className="absolute inset-[3px] rounded-2xl border border-border/20 bg-card/30 overflow-hidden animate-pulse" style={{ zIndex: 1, opacity: 0.4 }} />
          <SkeletonCard />
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
      className="px-4 pt-2"
    >
      {/* Social heading */}
      <div className="flex items-center gap-2 mb-3">
        <UserGroupIcon className="h-4 w-4 text-indigo-500" />
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
          Social
        </span>
      </div>

      {/* Card stack */}
      <div className="relative" style={{ minHeight: 400 }}>
        {/* Preview card — previous (swipe right reveals previous) */}
        {prevPost && (
          <div
            className="absolute inset-0 rounded-2xl border border-border/30 bg-card overflow-hidden pointer-events-none select-none"
            style={{
              zIndex: 1,
              transform: `scale(${0.92 + prevProgress * 0.08}) translateY(${(1 - prevProgress) * 10}px)`,
              opacity: 0.3 + prevProgress * 0.7,
              willChange: "transform, opacity",
              transition: swipeDx === 0
                ? "transform 0.45s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.35s ease"
                : "none",
            }}
          >
            <div className="flex items-center gap-3 px-4 pt-3.5 pb-3 border-b border-border/10">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white text-[10px] font-black shrink-0">
                {getInitials(prevPost.author?.name || "?")}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-bold text-foreground/70 truncate">{prevPost.author?.name || "Unknown"}</p>
                <p className="text-[9px] text-muted-foreground/40">{timeAgo(prevPost.createdAt)}</p>
              </div>
            </div>
            <div className="p-4">
              <p className="text-[12px] text-foreground/50 leading-relaxed line-clamp-4">
                {stripHandledUrls(prevPost.content?.replace(/<[^>]*>/g, "") || "").slice(0, 120) || "No content"}
              </p>
            </div>
          </div>
        )}

        {/* Preview card — next (swipe left reveals next) */}
        {nextPost && (
          <div
            className="absolute inset-0 rounded-2xl border border-border/30 bg-card overflow-hidden pointer-events-none select-none"
            style={{
              zIndex: 2,
              transform: `scale(${0.92 + nextProgress * 0.08}) translateY(${(1 - nextProgress) * 10}px)`,
              opacity: 0.3 + nextProgress * 0.7,
              willChange: "transform, opacity",
              transition: swipeDx === 0
                ? "transform 0.45s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.35s ease"
                : "none",
            }}
          >
            <div className="flex items-center gap-3 px-4 pt-3.5 pb-3 border-b border-border/10">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center text-white text-[10px] font-black shrink-0">
                {getInitials(nextPost.author?.name || "?")}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-bold text-foreground/70 truncate">{nextPost.author?.name || "Unknown"}</p>
                <p className="text-[9px] text-muted-foreground/40">{timeAgo(nextPost.createdAt)}</p>
              </div>
            </div>
            <div className="p-4">
              <p className="text-[12px] text-foreground/50 leading-relaxed line-clamp-4">
                {stripHandledUrls(nextPost.content?.replace(/<[^>]*>/g, "") || "").slice(0, 120) || "No content"}
              </p>
            </div>
          </div>
        )}

        {/* Current post card (swipeable) */}
        <div style={{ position: "relative", zIndex: 10 }}>
          <PostCard
            key={posts[activeIdx].id}
            post={posts[activeIdx]}
            isActive={true}
            index={activeIdx}
            onSwipeLeft={() => {
              if (activeIdx < posts.length - 1) setActiveIdx((p) => Math.min(p + 1, posts.length - 1));
            }}
            onSwipeRight={() => {
              if (activeIdx > 0) setActiveIdx((p) => Math.max(p - 1, 0));
            }}
            onSwiping={(dx) => setSwipeDx(dx)}
          />
        </div>
      </div>

      {/* Navigation dots */}
      <div className="flex items-center justify-center gap-1.5 mt-3">
        {posts.map((_, i) => (
          <div
            key={i}
            className={cn(
              "rounded-full transition-all duration-300",
              i === activeIdx ? "bg-indigo-500" : "bg-border/50"
            )}
            style={{
              height: i === activeIdx ? 6 : 4,
              width: i === activeIdx ? 6 : 4,
              opacity: i === activeIdx ? 1 : 0.4,
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}
