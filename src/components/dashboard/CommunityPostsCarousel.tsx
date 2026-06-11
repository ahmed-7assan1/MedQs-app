"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { markdownComponentsWithImages } from "@/components/ui/markdown-components";
import { enhancePlainImageUrls } from "@/lib/markdown-helpers";
import { cn } from "@/lib/utils";
import {
  ArrowRightIcon, ArrowLeftIcon,
  SparklesIcon,
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
  createdAt: string;
  author: PostAuthor;
  _count?: { likes: number; comments: number };
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
              <div
                key={post.id}
                className={cn(
                  "snap-start shrink-0 w-[82vw] md:w-[44vw] lg:w-[30vw]",
                  "rounded-xl border border-border/30 bg-muted/10 overflow-hidden",
                  "flex flex-col transition-all duration-300",
                  !near && "opacity-40 scale-[0.97]"
                )}
                style={{ height: "300px" }}
              >
                <div className="flex items-center gap-2.5 px-3.5 pt-3 pb-2 border-b border-border/10">
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

                <div className="flex-1 overflow-hidden px-3.5 py-2 relative">
                  {near ? (
                    <div className="text-[12px] leading-relaxed text-foreground [&_img]:max-h-[90px] [&_img]:rounded-lg [&_img]:object-cover [&_img]:w-full [&_img]:mt-1.5 [&_p]:mb-1.5 [&_p]:leading-relaxed [&_a]:text-indigo-500 [&_a]:font-medium line-clamp-[8]">
                      <ReactMarkdown components={markdownComponentsWithImages}>
                        {enhancePlainImageUrls(post.content || "")}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <div className="text-[12px] text-muted-foreground/70 leading-relaxed line-clamp-[8]">
                      {post.content?.replace(/<[^>]*>/g, "").slice(0, 200) || "No content"}
                    </div>
                  )}
                </div>

                <div className="px-3.5 pb-2.5 pt-1.5 border-t border-border/10 flex items-center justify-between">
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
