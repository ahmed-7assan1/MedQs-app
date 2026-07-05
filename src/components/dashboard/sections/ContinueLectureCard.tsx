"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Play, BookOpen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getYouTubeId, getYouTubeThumbnail } from "@/lib/video-utils";
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
    <Card className="overflow-hidden border-border/40 shadow-sm">
      <div className="relative mx-2 mt-2 aspect-video rounded-lg overflow-hidden bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
        {thumbnailUrl ? (
          <>
            <Image
              src={thumbnailUrl}
              alt={lecture.lectureTitle}
              fill
              className="object-cover"
              onError={() => {
                if (!useFallbackImg) {
                  setUseFallbackImg(true);
                } else {
                  setImgError(true);
                }
              }}
            />
            <div className="absolute inset-0 bg-black/10" />
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
  );
}
