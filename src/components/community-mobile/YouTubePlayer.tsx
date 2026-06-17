// src/components/community-mobile/YouTubePlayer.tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import { Play } from "lucide-react";

interface YouTubePlayerProps {
  videoId: string;
}

export default function YouTubePlayer({ videoId }: YouTubePlayerProps) {
  const [activated, setActivated] = useState(false);

  if (activated) {
    return (
      <div className="relative aspect-video overflow-hidden rounded-xl bg-muted">
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
          title="YouTube video"
          allow="accelerate-y; autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 h-full w-full border-0"
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setActivated(true)}
      className="group relative block aspect-video w-full overflow-hidden rounded-xl bg-muted"
    >
      <Image
        src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
        alt="Video thumbnail"
        fill
        sizes="(max-width: 480px) 100vw, 400px"
        className="object-cover"
      />
      <div className="absolute inset-0 flex items-center justify-center bg-black/20 transition-colors group-active:bg-black/30">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 shadow-sm">
          <Play className="h-5 w-5 fill-foreground text-foreground" strokeWidth={1.5} />
        </span>
      </div>
    </button>
  );
}
