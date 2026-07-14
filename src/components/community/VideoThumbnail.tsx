"use client";

import { useState } from "react";
import { Play } from "lucide-react";
import { cn } from "@/lib/utils";

function extractYouTubeId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  return match ? match[1] : null;
}

export function VideoThumbnail({
  url,
  onClick,
  className,
}: {
  url: string;
  onClick?: () => void;
  className?: string;
}) {
  const [posterFailed, setPosterFailed] = useState(false);
  const youtubeId = extractYouTubeId(url);
  const posterUrl = youtubeId
    ? `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`
    : null;

  if (!posterUrl || posterFailed) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "relative w-full rounded-lg overflow-hidden flex items-center justify-center bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-border/20 group cursor-pointer active:scale-[0.98] transition-all",
          className
        )}
      >
        <div className="flex flex-col items-center gap-1.5 text-muted-foreground/60">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-foreground/10 group-hover:bg-foreground/20 transition-colors">
            <Play className="h-5 w-5 fill-current ml-0.5" />
          </div>
          <span className="text-[10px] font-medium">Video</span>
        </div>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative w-full rounded-lg overflow-hidden group cursor-pointer active:scale-[0.98] transition-all bg-black/10",
        className
      )}
    >
      <img
        src={posterUrl}
        alt="Video thumbnail"
        loading="lazy"
        decoding="async"
        onError={() => setPosterFailed(true)}
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
        <div className="flex items-center justify-center w-11 h-11 rounded-full bg-white/90 shadow-lg group-hover:scale-110 transition-transform">
          <Play className="h-5 w-5 text-black ml-0.5 fill-current" />
        </div>
      </div>
    </button>
  );
}
