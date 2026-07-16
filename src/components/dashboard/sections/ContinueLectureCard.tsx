"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Play, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getYouTubeId, getYouTubeThumbnail } from "@/lib/video-utils";
import { SidebarLabel } from "@/components/dashboard/shared/SidebarLabel";
import type { LastLectureInfo } from "@/types/dashboard";

const HQ_FALLBACK = "hqdefault.jpg";

export function ContinueLectureCard({ lecture }: { lecture: LastLectureInfo | null }) {
  const [imgError, setImgError] = useState(false);
  const [useFallbackImg, setUseFallbackImg] = useState(false);

  if (!lecture) {
    return (
      <div className="space-y-2">
        <SidebarLabel icon={Play} label="Continue Lecture" />
        <Link
          href="/modules"
          className="flex items-center gap-2 p-4 rounded-xl border border-border/30 bg-card/30 text-xs text-muted-foreground hover:text-foreground transition-[color,opacity] duration-200"
        >
          <BookOpen className="h-4 w-4 text-muted-foreground/50 shrink-0" />
          <span>No lecture in progress. Start studying!</span>
        </Link>
      </div>
    );
  }

  const videoId = lecture.videoUrl ? getYouTubeId(lecture.videoUrl) : null;
  const thumbnailUrl = videoId && !imgError
    ? (useFallbackImg
        ? `https://img.youtube.com/vi/${videoId}/${HQ_FALLBACK}`
        : getYouTubeThumbnail(videoId))
    : null;

  return (
    <div className="space-y-3">
      <SidebarLabel icon={Play} label="Continue Lecture" />
      
      <div className="rounded-xl border border-border/30 bg-card/40 backdrop-blur-sm p-3.5 shadow-sm transition-[transform,opacity,box-shadow,border-color] duration-300 hover:shadow-md hover:border-primary/30">
        <div className="relative aspect-video rounded-lg overflow-hidden bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center group/card mb-3.5">
          {thumbnailUrl ? (
            <>
              <Image
                src={thumbnailUrl}
                alt={lecture.lectureTitle}
                fill
                className="object-cover transition-transform duration-300 group-hover/card:scale-105"
                onError={() => {
                  if (!useFallbackImg) {
                    setUseFallbackImg(true);
                  } else {
                    setImgError(true);
                  }
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover/card:bg-black/20 transition-[transform,opacity,box-shadow,border-color] duration-300">
                <div className="flex items-center justify-center w-9 h-9 rounded-full bg-primary/95 text-primary-foreground shadow-lg shadow-primary/30 opacity-0 group-hover/card:opacity-100 scale-90 group-hover/card:scale-100 transition-[transform,opacity,box-shadow,border-color] duration-300">
                  <Play className="h-4.5 w-4.5 fill-current ml-0.5" />
                </div>
              </div>
            </>
          ) : (
            <BookOpen className="h-8 w-8 text-muted-foreground/50" />
          )}
        </div>
        
        <div className="space-y-3">
          <div>
            <p className="text-[10px] font-black text-primary uppercase tracking-widest leading-none">Lecture in progress</p>
            <h4 className="text-xs font-black text-foreground leading-snug line-clamp-2 mt-1.5">
              {lecture.lectureTitle}
            </h4>
            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mt-0.5">
              {lecture.subjectName}
            </p>
          </div>
          
          <Button
            asChild
            size="sm"
            className="w-full h-9 rounded-lg text-[10px] font-black uppercase tracking-wider gap-1.5 bg-primary text-primary-foreground hover:opacity-90 transition-all"
          >
            <Link href={`/modules/${lecture.moduleId}/lectures/${lecture.lectureId}`}>
              <Play className="h-3 w-3 fill-current" /> Continue Studying
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
