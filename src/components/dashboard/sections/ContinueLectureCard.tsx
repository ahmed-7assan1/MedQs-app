"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Play, BookOpen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getYouTubeId, getYouTubeThumbnail } from "@/lib/video-utils";
import { SectionHeader } from "@/components/dashboard/shared/SectionHeader";
import type { LastLectureInfo } from "@/types/dashboard";

const HQ_FALLBACK = "hqdefault.jpg";

export function ContinueLectureCard({ lecture }: { lecture: LastLectureInfo | null }) {
  const [imgError, setImgError] = useState(false);
  const [useFallbackImg, setUseFallbackImg] = useState(false);

  if (!lecture) return null;

  const videoId = lecture.videoUrl ? getYouTubeId(lecture.videoUrl) : null;
  const thumbnailUrl = videoId && !imgError
    ? (useFallbackImg
        ? `https://img.youtube.com/vi/${videoId}/${HQ_FALLBACK}`
        : getYouTubeThumbnail(videoId))
    : null;

  return (
    <>
    <SectionHeader icon={Play} title="Continue Lecture" />
    <Card className="overflow-hidden border-border/40 shadow-sm min-h-[150px]">
      <div className="relative mx-2 mt-2 aspect-video rounded-lg overflow-hidden bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center group/card">
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
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-all duration-300">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/90 text-primary-foreground shadow-lg shadow-primary/30">
                <Play className="h-5 w-5 ml-0.5" />
              </div>
            </div>
          </>
        ) : (
          <BookOpen className="h-10 w-10 text-muted-foreground/40" />
        )}
      </div>

      <CardContent className="flex flex-col min-w-0 p-4">
        <div className="min-w-0">
          <p className="text-sm font-bold text-foreground leading-snug line-clamp-2">
            {lecture.lectureTitle}
          </p>
          <div className="flex items-center gap-1.5 mt-2">
            <Avatar className="h-4 w-4 shrink-0">
              {lecture.channelAvatar ? (
                <AvatarImage src={lecture.channelAvatar} alt={lecture.channelName} />
              ) : null}
              <AvatarFallback className="text-[7px] font-black bg-primary/10 text-primary">
                {lecture.channelName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <span className="text-[10px] font-bold text-muted-foreground truncate">
              {lecture.channelName}
            </span>
          </div>
        </div>

        <Button
          asChild
          size="sm"
          className="self-end mt-3 h-8 rounded-lg text-[10px] font-black uppercase tracking-wider gap-1.5"
        >
          <Link href={`/modules/${lecture.moduleId}`}>
            <Play className="h-3.5 w-3.5" /> Continue
          </Link>
        </Button>
      </CardContent>
    </Card>
    </>
  );
}
