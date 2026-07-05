"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { Play, Paperclip, Heart, MessageSquare, ArrowRight, MessageCircle } from "lucide-react";
import { SectionHeader } from "@/components/dashboard/shared/SectionHeader";

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
        <p className="text-xs leading-relaxed text-foreground/85 line-clamp-4" dir="auto">
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
            <div className="h-9 w-9 rounded-full bg-white/90 shadow-lg flex items-center justify-center">
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
        <div className="shrink-0 space-y-1">
          {fileAttachments.slice(0, 2).map((a: any, i: number) => {
            const fileName = a.name || a.fileName || a.url?.split("/").pop() || `file-${i + 1}`;
            return (
              <a
                key={i}
                href={a.url || a}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/8 border border-amber-500/15 hover:bg-amber-500/15 transition-colors"
              >
                <Paperclip className="h-3 w-3 text-amber-500 shrink-0" />
                <span className="text-[10px] font-medium text-foreground/70 truncate flex-1">
                  {fileName}
                </span>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}

function PostCard({ post }: { post: PostData }) {
  return (
    <Card className="overflow-hidden border-border/40 shadow-sm h-[390px]">
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
            <p className="text-[10px] text-muted-foreground/60 leading-tight">
              @{post.author?.name?.toLowerCase().replace(/\s+/g, "") || "unknown"} &middot; {timeAgo(post.createdAt)}
            </p>
          </div>
        </div>

        <PostCardBody post={post} />

        <div className="shrink-0 px-3.5 pb-3 pt-2 border-t border-border/10">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-muted-foreground/50">
              <Heart className="h-3 w-3" />
              <span className="text-[10px] font-bold">
                {post._count?.likes && post._count.likes > 0 ? post._count.likes.toLocaleString() : ""}
              </span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground/50">
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

export function CommunityCarouselSidebar() {
  const [posts, setPosts] = useState<PostData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [api, setApi] = useState<any>(null);

  useEffect(() => {
    if (!api) return;
    const interval = setInterval(() => {
      api.scrollNext();
    }, 30000);
    return () => clearInterval(interval);
  }, [api]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const forumRes = await fetch("/api/v1/forums?type=GLOBAL");
        if (!forumRes.ok) throw new Error();
        const forums = await forumRes.json();
        const gf = Array.isArray(forums) ? forums.find((f: any) => f.type === "GLOBAL") : null;
        if (!gf) throw new Error();

        const postsRes = await fetch(`/api/v1/forums/${gf.id}/posts?page=1&limit=6`);
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

  if (loading) return <div className="h-[420px]"><CarouselSkeleton /></div>;
  if (error || posts.length === 0) return <div className="h-[420px]" />;

  return (
    <div className="w-full h-[420px]">
      <SectionHeader icon={MessageCircle} title="Social" />

      <Carousel
        opts={{ loop: true, align: "start" }}
        setApi={setApi}
      >
        <CarouselContent>
          {posts.map((post) => (
            <CarouselItem key={post.id}>
              <PostCard post={post} />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  );
}
