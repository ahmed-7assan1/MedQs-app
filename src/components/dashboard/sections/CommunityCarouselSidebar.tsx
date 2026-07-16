"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { Play, Heart, MessageSquare, ArrowRight, ArrowLeft, MessageCircle, FileText, FileImage, FileCode, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { SectionHeader } from "@/components/dashboard/shared/SectionHeader";
import { useCommunityPosts } from "@/lib/dashboard-fetch";

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
  youtubeUrl?: string;
  interactionsDisabled?: boolean;
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

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n.charAt(0).toUpperCase())
    .join("");
}

function extractYouTubeId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  return match ? match[1] : null;
}

function stripMediaUrls(text: string): string {
  if (!text) return text;
  return text
    .replace(/(https?:\/\/(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)[a-zA-Z0-9_-]{11})/gi, "")
    .replace(/https?:\/\/(?:www\.)?(?:t\.me|telegram\.me)\/[a-zA-Z0-9_]+\/\d+/gi, "")
    .replace(/https?:\/\/[^\s]+\.(mp4|webm|mov|avi|mkv|mp3|wav|ogg|aac|flac|m4a)(\?[^\s]*)?/gi, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
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

function FileIcon({ url }: { url: string }) {
  const ext = url.split("?")[0].toLowerCase();
  if (ext.match(/\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)$/)) return <FileImage className="h-4 w-4 text-sky-500" />;
  if (ext.match(/\.pdf$/)) return <FileText className="h-4 w-4 text-red-500" />;
  return <FileCode className="h-4 w-4 text-muted-foreground" />;
}

function PostCardBody({ post }: { post: PostData }) {
  const contentSrc = stripMediaUrls(post.content || "");
  const attachments = useMemo(() => parseAttachments(post.attachments), [post.attachments]);
  const fileAttachments = attachments.filter((a: any) => detectMediaType(a.url || a) === "file");
  const imageAttachments = attachments.filter((a: any) => detectMediaType(a.url || a) === "image");

  const youtubeId = useMemo(() => {
    if (post.youtubeUrl) {
      const id = extractYouTubeId(post.youtubeUrl);
      if (id) return id;
    }
    if (attachments.length > 0) return null;
    const match = post.content?.match(
      /(https?:\/\/(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)[a-zA-Z0-9_-]{11})/i
    );
    return match ? extractYouTubeId(match[1]) : null;
  }, [post.content, post.youtubeUrl, attachments]);

  return (
    <div className="flex-1 overflow-y-auto px-3.5 py-2.5 flex flex-col gap-2 scrollbar-thin scrollbar-thumb-border/30 scrollbar-track-transparent">
      {contentSrc && (
        <p className="text-xs leading-relaxed text-foreground line-clamp-4" dir="auto">
          {contentSrc.replace(/<[^>]*>/g, "").slice(0, 250)}
        </p>
      )}

      {youtubeId && (
        <div className="shrink-0 rounded-lg overflow-hidden aspect-video bg-muted/20 ring-1 ring-border/20 relative">
          <img
            src={`https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-black/15 flex items-center justify-center">
            <div className="h-9 w-9 rounded-full bg-background/90 shadow-lg flex items-center justify-center">
              <Play className="h-4 w-4 text-foreground ml-0.5" />
            </div>
          </div>
        </div>
      )}

      {(post.imageUrl || imageAttachments.length > 0) && (
        <div className="shrink-0 rounded-lg overflow-hidden bg-muted/20">
          <img
            src={post.imageUrl || imageAttachments[0]?.url || imageAttachments[0]}
            alt=""
            className="w-full h-28 object-cover"
            loading="lazy"
          />
        </div>
      )}

      {fileAttachments.length > 0 && (
        <div className="shrink-0 space-y-1.5">
          {fileAttachments.slice(0, 2).map((a: any, i: number) => {
            const url = a.url || a;
            const fileName = a.name || a.fileName || url.split("/").pop() || `file-${i + 1}`;
            return (
              <div key={i} className="flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-2.5 group hover:bg-muted transition-colors">
                <FileIcon url={url} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{fileName}</p>
                  <p className="text-[10px] text-muted-foreground">{a.type || "File"}</p>
                </div>
                <a href={url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                  className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors shrink-0">
                  <Download className="h-3.5 w-3.5" />
                </a>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function PostCard({ post }: { post: PostData }) {
  return (
    <Card className="overflow-hidden border-border/40 shadow-sm h-[300px]">
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-2.5 px-3.5 pt-3 pb-2.5 border-b border-border/10 shrink-0">
          <Avatar className="h-7 w-7 shrink-0">
            {post.author?.image ? (
              <AvatarImage src={post.author.image} alt={post.author.name} />
            ) : null}
            <AvatarFallback className="text-[9px] font-black bg-primary/10 text-primary">
              {getInitials(post.author?.name || "?")}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-foreground truncate leading-tight">
              {post.author?.name || "Unknown"}
            </p>
            <p className="text-[10px] text-muted-foreground leading-tight">
              @{post.author?.name?.toLowerCase().replace(/\s+/g, "") || "unknown"} &middot; {timeAgo(post.createdAt)}
            </p>
          </div>
        </div>

        <PostCardBody post={post} />

        <div className="shrink-0 px-3.5 pb-3 pt-2 border-t border-border/10">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Heart className="h-3 w-3" />
              <span className="text-[10px] font-bold">
                {post._count?.likes && post._count.likes > 0 ? post._count.likes.toLocaleString() : ""}
              </span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <MessageSquare className="h-3 w-3" />
              <span className="text-[10px] font-bold">
                {post._count?.comments && post._count.comments > 0 ? post._count.comments.toLocaleString() : ""}
              </span>
            </div>
            <div className="flex-1" />
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="h-7 px-2.5 rounded-md text-[10px] font-bold gap-1 text-indigo-500 hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-primary hover:to-accent"
            >
              <Link href={`/social?post=${post.id}`}>
                Read more
                <ArrowRight className="h-3 w-3" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

function CarouselSkeleton() {
  return (
    <div className="w-full h-full animate-pulse flex flex-col">
      <div className="flex items-center gap-2 mb-3">
        <div className="h-4 w-4 rounded bg-muted/40" />
        <div className="h-3 w-16 rounded bg-muted/40" />
      </div>
      <div className="flex-1">
        <Card className="overflow-hidden border-border/40 shadow-sm h-full">
        <div className="flex items-center gap-2.5 px-3.5 pt-3 pb-2.5 border-b border-border/10">
          <div className="h-7 w-7 rounded-full bg-muted/40" />
          <div className="space-y-1.5 flex-1">
            <div className="h-3 w-20 rounded bg-muted/40" />
            <div className="h-2 w-12 rounded bg-muted/30" />
          </div>
        </div>
        <div className="p-3.5 space-y-2.5">
          <div className="h-3 w-full rounded bg-muted/30" />
          <div className="h-3 w-4/5 rounded bg-muted/30" />
          <div className="h-3 w-3/5 rounded bg-muted/20" />
          <div className="h-24 w-full rounded-lg bg-muted/20" />
        </div>
      </Card>
    </div>
    </div>
  );
}

export function CommunityCarouselSidebar({ sidebarOpen }: { sidebarOpen?: boolean }) {
  const { data: raw, error, isLoading } = useCommunityPosts();
  const [api, setApi] = useState<any>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (!api) return;
    setSelectedIndex(api.selectedScrollSnap());
    api.on("select", () => setSelectedIndex(api.selectedScrollSnap()));
  }, [api]);

  useEffect(() => {
    if (!api) return;
    const timer = setTimeout(() => api.reInit(), 500);
    return () => clearTimeout(timer);
  }, [sidebarOpen, api]);

  useEffect(() => {
    if (!api || isPaused) return;
    const interval = setInterval(() => api.scrollNext(), 30000);
    return () => clearInterval(interval);
  }, [api, isPaused]);

  if (isLoading) return <div className="h-80"><CarouselSkeleton /></div>;
  if (error) throw new Error("Failed to load community posts");

  const body = (raw as any)?.data ?? raw;
  const rawPosts = body?.items ?? [];
  const posts: PostData[] = Array.isArray(rawPosts) ? rawPosts : [];
  if (posts.length === 0) {
    return (
      <div>
        <SectionHeader icon={MessageCircle} title="Social" />
        <Button variant="outline" asChild className="w-full p-0 h-auto rounded-xl border-dashed bg-card/30 hover:bg-card/50">
          <Link href="/social" className="flex items-center justify-between p-5">
            <div className="flex items-center gap-3">
              <MessageCircle className="h-7 w-7 text-muted-foreground/50" />
              <div>
                <p className="text-sm font-bold text-foreground">No community posts yet</p>
                <p className="text-xs text-muted-foreground">Be the first to share something</p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div onMouseEnter={() => setIsPaused(true)} onMouseLeave={() => setIsPaused(false)} onFocus={() => setIsPaused(true)} onBlur={() => setIsPaused(false)}>
      <SectionHeader
        icon={MessageCircle}
        title="Social"
        right={
          <div className="flex items-center gap-1">
            <button onClick={() => api?.scrollPrev()} className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/40 bg-card/40 text-muted-foreground hover:bg-card/60 hover:text-primary transition-all">
              <ArrowLeft className="h-3.5 w-3.5" />
            </button>
            <button onClick={() => api?.scrollNext()} className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/40 bg-card/40 text-muted-foreground hover:bg-card/60 hover:text-primary transition-all">
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        }
      />

      <Carousel
        opts={{ loop: true, align: "center", slidesToScroll: 1, containScroll: false }}
        setApi={setApi}
      >
        <CarouselContent className="-ml-2 md:-ml-3">
          {posts.map((post, idx) => (
              <CarouselItem key={post.id} className="basis-1/3 lg:basis-[300px] pl-2 md:pl-3">
              <div className={cn(
                "transition-all duration-300",
                idx === selectedIndex
                  ? "opacity-100 scale-100"
                  : "opacity-40 scale-[0.92] blur-[1px] pointer-events-none"
              )}>
                <PostCard post={post} />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  );
}
