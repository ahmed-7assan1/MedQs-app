"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { Play, Video, ArrowRight, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { getYouTubeThumbnail } from "@/lib/video-utils";
import { SectionHeader } from "@/components/dashboard/shared/SectionHeader";

const HQ_FALLBACK = "hqdefault.jpg";

interface SuggestedVideo {
  id: string;
  videoId: string;
  title: string;
  thumbnail: string | null;
  lectureId: string;
  lectureTitle: string;
  moduleId: string;
  subjectName: string;
  channelTitle: string;
  channelThumbnail: string | null;
}

function VideoCard({ video }: { video: SuggestedVideo }) {
  const [imgError, setImgError] = useState(false);
  const [useFallbackImg, setUseFallbackImg] = useState(false);

  const videoId = video.videoId;
  const thumbnailUrl = videoId && !imgError
    ? (useFallbackImg
        ? `https://img.youtube.com/vi/${videoId}/${HQ_FALLBACK}`
        : getYouTubeThumbnail(videoId))
    : null;

  return (
    <Link href={`/modules/${video.moduleId}/lectures/${video.lectureId}`}>
      <Card className="overflow-hidden border-border/40 shadow-sm h-[300px] group cursor-pointer">
        <div className="relative aspect-video bg-muted/20 overflow-hidden">
          {thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt={video.title}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
              onError={() => {
                if (!useFallbackImg) {
                  setUseFallbackImg(true);
                } else {
                  setImgError(true);
                }
              }}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Play className="h-8 w-8 text-muted-foreground/40" />
            </div>
          )}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
            <div className="h-10 w-10 rounded-full bg-white/90 shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 scale-90 group-hover:scale-100">
              <Play className="h-5 w-5 text-foreground ml-0.5" />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-1.5 px-3 py-2.5 flex-1 min-h-0">
          <p className="text-xs font-bold text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">
            {video.title}
          </p>
          <p className="text-[10px] text-muted-foreground/60 truncate">
            {video.lectureTitle} &middot; {video.subjectName}
          </p>
          <div className="flex items-center gap-1.5 mt-auto pt-1">
            <Avatar className="h-5 w-5 shrink-0">
              {video.channelThumbnail ? (
                <AvatarImage src={video.channelThumbnail} alt={video.channelTitle} />
              ) : null}
              <AvatarFallback className="text-[6px] font-black bg-primary/10 text-primary">
                {video.channelTitle.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <span className="text-[9px] font-medium text-muted-foreground/70 truncate">
              {video.channelTitle}
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}

function CarouselSkeleton() {
  return (
    <div className="w-full animate-pulse">
      <div className="flex items-center gap-2 mb-3">
        <div className="h-4 w-4 rounded bg-muted/40" />
        <div className="h-3 w-20 rounded bg-muted/40" />
      </div>
      <div className="flex gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="overflow-hidden border-border/40 shadow-sm h-[300px] flex-1">
            <div className="aspect-video bg-muted/20" />
            <div className="p-3 space-y-2.5">
              <div className="h-3 w-full rounded bg-muted/30" />
              <div className="h-3 w-4/5 rounded bg-muted/30" />
              <div className="h-2 w-3/5 rounded bg-muted/20" />
              <div className="flex items-center gap-1.5 pt-1">
                <div className="h-5 w-5 rounded-full bg-muted/30" />
                <div className="h-2 w-14 rounded bg-muted/20" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function SuggestedVideosCarousel({ sidebarOpen }: { sidebarOpen?: boolean }) {
  const [videos, setVideos] = useState<SuggestedVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [api, setApi] = useState<any>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

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
        const res = await fetch("/api/v1/videos/curriculum?page=1&limit=6");
        if (!res.ok) throw new Error();
        const data = await res.json();
        const items = data.items || [];
        if (!cancelled) setVideos(Array.isArray(items) ? items : []);
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) return <div className="h-80"><CarouselSkeleton /></div>;
  if (error || videos.length === 0) return null;

  return (
    <div>
      <SectionHeader
        icon={Video}
        title="Suggested Videos"
        right={
          <div className="flex items-center gap-1">
            <button onClick={() => api?.scrollPrev()} className="flex h-7 w-7 items-center justify-center rounded-lg border border-border/40 bg-card/40 text-muted-foreground hover:bg-card/60 hover:text-primary transition-all">
              <ArrowLeft className="h-3.5 w-3.5" />
            </button>
            <button onClick={() => api?.scrollNext()} className="flex h-7 w-7 items-center justify-center rounded-lg border border-border/40 bg-card/40 text-muted-foreground hover:bg-card/60 hover:text-primary transition-all">
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
          {videos.map((video, idx) => (
              <CarouselItem key={video.id} className="basis-1/3 lg:basis-[280px] pl-2 md:pl-3">
              <div className={cn(
                "transition-all duration-300",
                idx === selectedIndex
                  ? "opacity-100 scale-100"
                  : "opacity-40 scale-[0.92] blur-[1px] pointer-events-none"
              )}>
                <VideoCard video={video} />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  );
}
