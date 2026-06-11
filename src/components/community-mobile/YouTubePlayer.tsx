"use client";

import { useState } from "react";
import { Play, Clock } from "@phosphor-icons/react";

interface YouTubePlayerProps {
  videoId: string;
  thumbnail?: string;
  duration?: string;
  caption?: string;
}

export function YouTubePlayer({ videoId, thumbnail, duration, caption }: YouTubePlayerProps) {
  const [playing, setPlaying] = useState(false);
  const thumb = thumbnail || `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

  if (playing) {
    return (
      <div className="relative overflow-hidden rounded-xl" style={{ aspectRatio: "16/9" }}>
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&controls=0&modestbranding=1&rel=0&showinfo=0&iv_load_policy=3&fs=0&disablekb=1&playsinline=1`}
          className="absolute inset-0 w-full h-full"
          allow="autoplay; encrypted-media"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-xl cursor-pointer" style={{ aspectRatio: "16/9" }}>
      <img
        src={thumb}
        alt={caption || "YouTube video"}
        className="w-full h-full object-cover"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center transition-transform hover:scale-110"
          style={{ background: "var(--brand)", boxShadow: "0 4px 20px rgba(110,64,255,0.5)" }}
          onClick={() => setPlaying(true)}
        >
          <Play size={20} weight="fill" className="text-white ml-0.5" />
        </div>
      </div>
      {duration && (
        <div className="absolute bottom-2 right-2 community-glass-card rounded-md px-2 py-0.5 flex items-center gap-1">
          <Clock size={10} className="text-white/70" />
          <span className="text-[10px] font-medium text-white/70">{duration}</span>
        </div>
      )}
      {caption && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent p-3 pt-8">
          <span className="text-xs text-white font-medium">{caption}</span>
        </div>
      )}
    </div>
  );
}
