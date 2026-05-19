"use client";

import React from "react";
import { CustomVideoPlayer } from "@/components/content/CustomVideoPlayer";

interface VideoPlayerProps {
  src: string;
  poster?: string;
  className?: string;
  playing?: boolean;
  minimal?: boolean;
  muted?: boolean;
  startTime?: number;
  endTime?: number;
}

export function ProfessionalVideoPlayer({ 
  src, 
  poster, 
  className, 
  playing, 
  minimal = false,
  muted = false,
  startTime = 0,
  endTime
}: VideoPlayerProps) {
  return (
    <div className={className}>
      <CustomVideoPlayer
        url={src}
        poster={poster}
        playing={playing}
        minimal={minimal}
        muted={muted}
        startTime={startTime}
        endTime={endTime}
      />
    </div>
  );
}
