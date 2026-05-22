"use client";

import { cn } from "@/lib/utils";
import { VidStackPlayer } from "@/components/content/VidStackPlayer";

interface VideoPlayerProps {
  src: string;
  poster?: string;
  className?: string;
  playing?: boolean;
  muted?: boolean;
  startTime?: number;
  endTime?: number;
  minimal?: boolean;
}

export function ProfessionalVideoPlayer({ 
  src, 
  poster, 
  className, 
  playing, 
  muted = false,
  startTime = 0,
  ...rest
}: VideoPlayerProps) {
  return (
    <div className={cn(className)}>
      <VidStackPlayer
        url={src}
        poster={poster}
        playing={playing}
        muted={muted}
        startTime={startTime}
      />
    </div>
  );
}
