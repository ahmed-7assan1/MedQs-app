"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { markdownComponentsWithImages } from "@/components/ui/markdown-components";
import { enhancePlainImageUrls } from "@/lib/markdown-helpers";
import { cn } from "@/lib/utils";
import { SharedQuestionBlock } from "@/components/quiz/SharedQuestionBlock";
import {
  ArrowRightIcon, ArrowLeftIcon,
  SparklesIcon,
  PlayIcon,
  DocumentTextIcon,
  MusicalNoteIcon,
  PaperClipIcon,
} from "@heroicons/react/24/solid";

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
  if (typeof raw === "string") { try { const p = JSON.parse(raw); return Array.isArray(p) ? p : p ? [p] : []; } catch { return []; } }
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
  if (u.includes("youtube.com") || u.includes("youtu.be") || u.includes("t.me") || u.includes("telegram.me")) return "video";
  return "file";
}

function extractYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

export function CommunityPostsCarousel() {
  const [posts, setPosts] = useState<PostData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const forumRes = await fetch("/api/v1/forums?type=GLOBAL");
        if (!forumRes.ok) throw new Error();
        const forums = await forumRes.json();
        const gf = Array.isArray(forums) ? forums.find((f: any) => f.type === "GLOBAL") : null;
        if (!gf) throw new Error();

        const postsRes = await fetch(`/api/v1/forums/${gf.id}/posts?page=1&limit=10`);
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
    return () => { cancelled = true; };
  }, []);

  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollLeft } = scrollRef.current;
    const firstChild = scrollRef.current.children[0] as HTMLElement | undefined;
    if (!firstChild) return;
    const cardW = firstChild.offsetWidth + 16;
    setActiveIdx(Math.min(Math.max(Math.round(scrollLeft / cardW), 0), posts.length - 1));
  }, [posts.length]);

  const scrollTo = (idx: number) => {
    if (!scrollRef.current) return;
    const firstChild = scrollRef.current.children[0] as HTMLElement | undefined;
    if (!firstChild) return;
    const cardW = firstChild.offsetWidth + 16;
    scrollRef.current.scrollTo({ left: idx * cardW, behavior: "smooth" });
  };

  if (loading) {
    return (
      <div className="px-4">
        <div className="rounded-2xl border border-border/50 bg-card p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-4 w-4 rounded-full bg-muted/30 animate-pulse" />
            <div className="h-3 w-32 rounded bg-muted/30 animate-pulse" />
          </div>
          <div className="flex gap-4 overflow-hidden">
            {[0, 1, 2].map((i) => (
              <div key={i} className="shrink-0 w-[82vw] h-[300px] rounded-2xl bg-muted/20 animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || posts.length === 0) return null;

  return (
    <div className="px-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="rounded-2xl border border-border/50 bg-card p-4 md:p-5 shadow-sm"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded-md bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center">
              <SparklesIcon className="h-3 w-3 text-white" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
              Community Buzz
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => scrollTo(activeIdx - 1)}
              disabled={activeIdx === 0}
              className="h-7 w-7 rounded-lg bg-muted/30 border border-border/50 flex items-center justify-center active:scale-90 transition-all disabled:opacity-30"
            >
              <ArrowLeftIcon className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
            <span className="text-[10px] font-bold text-muted-foreground/60 min-w-[28px] text-center tabular-nums">
              {activeIdx + 1}/{posts.length}
            </span>
            <button
              onClick={() => scrollTo(activeIdx + 1)}
              disabled={activeIdx === posts.length - 1}
              className="h-7 w-7 rounded-lg bg-muted/30 border border-border/50 flex items-center justify-center active:scale-90 transition-all disabled:opacity-30"
            >
              <ArrowRightIcon className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </div>
        </div>

        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar pb-1"
        >
          {posts.map((post, idx) => {
            const near = Math.abs(idx - activeIdx) <= 1;
            return (
              <PostCard key={post.id} post={post} near={near} />
            );
          })}
        </div>

        <div className="mt-3 text-center">
          <Link
            href="/social"
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-100 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold text-[10px] uppercase tracking-[0.15em] active:scale-[0.97] transition-all hover:bg-indigo-200 dark:hover:bg-indigo-500/20"
          >
            Be With Us
            <ArrowRightIcon className="h-3.5 w-3.5" />
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

function PostCard({ post, near }: { post: PostData; near: boolean }) {
  const contentSrc = enhancePlainImageUrls(post.content || "");
  const attachments = useMemo(() => parseAttachments(post.attachments), [post.attachments]);
  const imageAttachments = attachments.filter((a: any) => detectMediaType(a.url || a) === "image");
  const videoAttachments = attachments.filter((a: any) => detectMediaType(a.url || a) === "video");
  const audioAttachments = attachments.filter((a: any) => detectMediaType(a.url || a) === "audio");
  const fileAttachments = attachments.filter((a: any) => detectMediaType(a.url || a) === "file");

  const inlineYouTubeUrl = useMemo(() => {
    if (attachments.length > 0) return null;
    const match = post.content?.match(/(https?:\/\/(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)[a-zA-Z0-9_-]{11})/i);
    return match ? match[1] : null;
  }, [post.content, attachments]);

  const inlineTelegramUrl = useMemo(() => {
    if (attachments.length > 0) return null;
    const match = post.content?.match(/https?:\/\/(?:www\.)?(?:t\.me|telegram\.me)\/([a-zA-Z0-9_]+)\/(\d+)/i);
    return match ? match[0] : null;
  }, [post.content, attachments]);

  const sharedQuestion = useMemo(() => {
    if (post.sharedQuestion) return post.sharedQuestion;
    if (post.sharedQuestionData) {
      if (typeof post.sharedQuestionData === "string") {
        try { return JSON.parse(post.sharedQuestionData); } catch { return null; }
      }
      return post.sharedQuestionData;
    }
    return null;
  }, [post.sharedQuestion, post.sharedQuestionData]);

  const poll = post.poll;
  const hasImage = post.imageUrl || imageAttachments.length > 0;
  const hasVideo = videoAttachments.length > 0 || inlineYouTubeUrl || inlineTelegramUrl;
  const hasAudio = audioAttachments.length > 0;
  const hasFiles = fileAttachments.length > 0;
  const hasRichContent = sharedQuestion || poll || hasImage || hasVideo || hasAudio || hasFiles;

  return (
    <div
      className={cn(
        "snap-start shrink-0 w-[82vw] md:w-[44vw] lg:w-[30vw]",
        "rounded-xl border border-border/30 bg-muted/10 overflow-hidden",
        "flex flex-col transition-all duration-300",
        !near && "opacity-40 scale-[0.97]"
      )}
      style={{ height: "320px" }}
    >
      <div className="flex items-center gap-2.5 px-3.5 pt-3 pb-2 border-b border-border/10 shrink-0">
        <div className="h-7 w-7 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-[11px] font-black shrink-0">
          {post.author?.name?.charAt(0)?.toUpperCase() || "?"}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-bold text-foreground truncate leading-tight">
            {post.author?.name || "Unknown"}
          </p>
          <p className="text-[9px] text-muted-foreground/50 truncate leading-tight">
            {timeAgo(post.createdAt)}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-hidden px-3.5 py-2 relative flex flex-col gap-1.5">
        {near ? (
          <>
            <div className="text-[12px] leading-relaxed text-foreground [&_img]:max-h-[80px] [&_img]:rounded-lg [&_img]:object-cover [&_img]:w-full [&_img]:mt-1 [&_p]:mb-1 [&_p]:leading-relaxed [&_a]:text-indigo-500 [&_a]:font-medium line-clamp-[6] overflow-hidden">
              <ReactMarkdown components={markdownComponentsWithImages}>
                {contentSrc}
              </ReactMarkdown>
            </div>

            {poll && (
              <div className="shrink-0 rounded-lg bg-muted/20 border border-border/20 p-2">
                <p className="text-[11px] font-bold text-foreground mb-1.5 truncate">{poll.question}</p>
                <div className="space-y-1">
                  {poll.options?.slice(0, 3).map((opt: any) => {
                    const total = poll.options.reduce((a: number, o: any) => a + (o._count?.votes || 0), 0);
                    const pct = total === 0 ? 0 : Math.round(((opt._count?.votes || 0) / total) * 100);
                    return (
                      <div key={opt.id} className="relative h-5 rounded-md bg-black/10 dark:bg-white/5 overflow-hidden">
                        <div className="absolute inset-0 bg-indigo-500/20 transition-all" style={{ width: `${pct}%` }} />
                        <div className="relative flex items-center justify-between px-2 h-full">
                          <span className="text-[9px] font-bold text-foreground/80 truncate">{opt.text}</span>
                          <span className="text-[8px] font-black text-muted-foreground/60">{pct}%</span>
                        </div>
                      </div>
                    );
                  })}
                  {poll.options?.length > 3 && (
                    <p className="text-[8px] text-muted-foreground/50 text-center">+{poll.options.length - 3} more options</p>
                  )}
                </div>
              </div>
            )}

            {sharedQuestion && (
              <div className="shrink-0 max-h-[80px] overflow-hidden rounded-lg border border-indigo-500/20 bg-indigo-500/5 p-2">
                <SharedQuestionBlock question={sharedQuestion} />
              </div>
            )}

            {post.imageUrl && !hasRichContent && (
              <img
                src={post.imageUrl}
                alt=""
                className="shrink-0 rounded-lg w-full object-cover max-h-[90px]"
                loading="lazy"
              />
            )}

            {imageAttachments.length > 0 && (
              <div className="shrink-0 flex gap-1 overflow-x-auto no-scrollbar">
                {imageAttachments.slice(0, 3).map((img: any, i: number) => (
                  <img
                    key={i}
                    src={img.url || img}
                    alt=""
                    className="h-[70px] w-auto rounded-lg object-cover"
                    loading="lazy"
                  />
                ))}
              </div>
            )}

            {(inlineYouTubeUrl || inlineTelegramUrl) && (
              <div className="shrink-0 rounded-lg bg-black/10 dark:bg-white/5 border border-border/20 flex items-center gap-2 p-2">
                <div className="h-7 w-7 rounded-md bg-rose-500/20 flex items-center justify-center shrink-0">
                  <PlayIcon className="h-3.5 w-3.5 text-rose-500" />
                </div>
                <span className="text-[10px] font-medium text-muted-foreground truncate">
                  {inlineYouTubeUrl ? "YouTube Video" : "Telegram Video"}
                </span>
              </div>
            )}

            {videoAttachments.length > 0 && (
              <div className="shrink-0 rounded-lg bg-black/10 dark:bg-white/5 border border-border/20 flex items-center gap-2 p-2">
                <div className="h-7 w-7 rounded-md bg-rose-500/20 flex items-center justify-center shrink-0">
                  <PlayIcon className="h-3.5 w-3.5 text-rose-500" />
                </div>
                <span className="text-[10px] font-medium text-muted-foreground truncate">
                  {videoAttachments.length} video{videoAttachments.length > 1 ? "s" : ""}
                </span>
              </div>
            )}

            {audioAttachments.length > 0 && (
              <div className="shrink-0 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/5 border border-emerald-500/20 flex items-center gap-2 p-2">
                <div className="h-7 w-7 rounded-md bg-emerald-500/20 flex items-center justify-center shrink-0">
                  <MusicalNoteIcon className="h-3.5 w-3.5 text-emerald-500" />
                </div>
                <span className="text-[10px] font-medium text-muted-foreground truncate">
                  {audioAttachments.length} audio file{audioAttachments.length > 1 ? "s" : ""}
                </span>
              </div>
            )}

            {fileAttachments.length > 0 && (
              <div className="shrink-0 rounded-lg bg-amber-500/10 dark:bg-amber-500/5 border border-amber-500/20 flex items-center gap-2 p-2">
                <div className="h-7 w-7 rounded-md bg-amber-500/20 flex items-center justify-center shrink-0">
                  <PaperClipIcon className="h-3.5 w-3.5 text-amber-500" />
                </div>
                <span className="text-[10px] font-medium text-muted-foreground truncate">
                  {fileAttachments.length} file{fileAttachments.length > 1 ? "s" : ""}
                </span>
              </div>
            )}
          </>
        ) : (
          <div className="text-[12px] text-muted-foreground/70 leading-relaxed line-clamp-[8]">
            {post.content?.replace(/<[^>]*>/g, "").slice(0, 200) || "No content"}
          </div>
        )}
      </div>

      <div className="shrink-0 px-3.5 pb-2.5 pt-1.5 border-t border-border/10 flex items-center justify-between">
        <Link
          href="/social"
          className="text-[10px] font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1 hover:gap-1.5 transition-all"
        >
          Read more
          <ArrowRightIcon className="h-3 w-3" />
        </Link>
        <div className="flex items-center gap-2 text-[9px] text-muted-foreground/40">
          {post._count && (
            <>
              <span>{post._count.likes} likes</span>
              <span>{post._count.comments} comments</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
