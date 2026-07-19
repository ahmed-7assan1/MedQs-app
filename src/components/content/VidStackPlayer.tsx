"use client";

import "vidstack/styles/base.css";
import "vidstack/styles/defaults.css";
import "vidstack/styles/community-skin/video.css";
import "vidstack/styles/ui/buttons.css";
import "vidstack/styles/ui/sliders.css";
import "vidstack/styles/ui/captions.css";
import "vidstack/styles/ui/menus.css";
import "vidstack/styles/ui/tooltips.css";
import "vidstack/styles/ui/buffering.css";

import React, { useState, useRef, useCallback, useEffect, Component } from "react";
import {
  MediaPlayer, MediaOutlet, MediaCommunitySkin,
  MediaGesture, MediaCaptions, MediaPIPButton,
} from "@vidstack/react";
import { cn } from "@/lib/utils";
import { Shrink, PictureInPicture2, Expand, Loader2, Play } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface VidStackPlayerProps {
  url: string;
  title?: string;
  poster?: string;
  className?: string;
  playing?: boolean;
  muted?: boolean;
  startTime?: number;
  hideBranding?: boolean;
  thumbnail?: string | null;
}

class VidStackErrorBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    return this.state.hasError ? null : this.props.children;
  }
}

/* ─── YouTube Player (Native iframe) ─── */
function NativeYouTubePlayer({ videoId, title, playing, startTime }: {
  videoId: string; title?: string; playing?: boolean; startTime?: number;
}) {
  const autoplay = playing ? 1 : 0;
  const start = startTime ? Math.floor(startTime) : 0;
  const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=${autoplay}&rel=0&modestbranding=1&enablejsapi=1${start ? `&start=${start}` : ""}`;
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      containerRef.current.requestFullscreen();
    }
  }, []);

  return (
    <div ref={containerRef} className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden group">
      <iframe
        src={embedUrl}
        title={title || "YouTube video player"}
        className="w-full h-full border-0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      />
      {/* Blocks YouTube logo + share + end cards (bottom 64px, desktop only) */}
      <div className="absolute bottom-0 left-0 right-0 z-10 hidden h-16 lg:block" />
      {/* Custom fullscreen — keeps overlay active when expanded */}
      <button
        onClick={toggleFullscreen}
        className="absolute bottom-[85px] right-[29px] z-20 hidden lg:flex items-center justify-center w-9 h-9 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-all"
        aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
      >
        {isFullscreen ? <Shrink size={14} /> : <Expand size={14} />}
      </button>
    </div>
  );
}

/* ─── VidStack Native Player (MP4, HLS, Drive proxy) ─── */
function VidStackNative({ url, title, poster, playing, muted, startTime, onMini }: {
  url: string; title?: string; poster?: string; playing?: boolean; muted?: boolean;
  startTime?: number; onMini: () => void;
}) {
  return (
    <VidStackErrorBoundary>
      <MediaPlayer
        src={url}
        poster={poster}
        title={title}
        autoplay={playing}
        muted={muted}
        currentTime={startTime ?? 0}
        load="visible"
        streamType="on-demand"
        viewType="video"
        style={{ width: "100%", height: "100%" }}
      >
        <MediaOutlet />

        {/* Gestures */}
        <MediaGesture event="dblclick" action="togglePaused" />
        <MediaGesture event="tap" action="togglePaused" />

        {/* Subtitles */}
        <MediaCaptions className="absolute bottom-16 left-0 right-0 text-center text-white/90 text-sm font-medium [&>span]:bg-black/60 [&>span]:px-3 [&>span]:py-1 [&>span]:rounded-xl [&>span]:backdrop-blur-md" />

        {/* PiP + Mini buttons */}
        <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={onMini}
            className="w-7 h-7 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-all flex items-center justify-center"
            title="Mini player">
            <Shrink size={12} />
          </button>
          <MediaPIPButton className="w-7 h-7 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-all flex items-center justify-center data-[active]:text-indigo-400" title="Picture-in-Picture">
            <PictureInPicture2 size={12} />
          </MediaPIPButton>
        </div>

        <MediaCommunitySkin />
      </MediaPlayer>
    </VidStackErrorBoundary>
  );
}

/* ─── Mini Player (floating) ─── */
function MiniPlayer({ url, videoId, title, poster, muted, onExpand }: {
  url: string; videoId: string | null; title?: string; poster?: string; muted?: boolean; onExpand: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef({ sx: 0, sy: 0, ex: 0, ey: 0 });

  const onDragStart = useCallback((e: React.MouseEvent) => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    drag.current = { sx: e.clientX, sy: e.clientY, ex: r.left, ey: r.top };
    const move = (ev: MouseEvent) => {
      if (!ref.current) return;
      ref.current.style.left = `${drag.current.ex + ev.clientX - drag.current.sx}px`;
      ref.current.style.top = `${drag.current.ey + ev.clientY - drag.current.sy}px`;
    };
    const up = () => { document.removeEventListener("mousemove", move); document.removeEventListener("mouseup", up); };
    document.addEventListener("mousemove", move);
    document.addEventListener("mouseup", up);
  }, []);

  return (
    <motion.div
      ref={ref}
      initial={{ scale: 0.8, opacity: 0, y: 40 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.8, opacity: 0, y: 40 }}
      className="fixed bottom-4 right-4 z-modal w-80 aspect-video rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-black cursor-grab active:cursor-grabbing"
    >
      <div onMouseDown={onDragStart} className="absolute inset-0">
        {videoId ? (
          <iframe
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`}
            className="w-full h-full pointer-events-none"
            allow="autoplay"
          />
        ) : (
          <VidStackErrorBoundary>
            <MediaPlayer
              src={url} poster={poster} title={title} autoplay muted={muted}
              load="visible" streamType="on-demand" viewType="video"
              style={{ width: "100%", height: "100%" }}
            >
              <MediaOutlet />
            </MediaPlayer>
          </VidStackErrorBoundary>
        )}
        <div className="absolute bottom-2 left-2 right-2 flex items-center gap-2 z-20">
          <button onClick={onExpand} className="w-7 h-7 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white/70 hover:bg-white/20 transition-all">
            <Expand size={12} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Play Overlay (thumbnail + play button only) ─── */
function PlayOverlay({ thumbnail, onPlay }: { thumbnail?: string | null; onPlay: () => void }) {
  return (
    <div
      onClick={onPlay}
      className="relative w-full aspect-video overflow-hidden rounded-2xl bg-black cursor-pointer group"
    >
      {thumbnail && (
        <img
          src={thumbnail}
          alt=""
          className="h-full w-full object-cover"
        />
      )}
      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors duration-300" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 shadow-2xl transition-transform duration-200 group-hover:scale-105 md:h-20 md:w-20">
          <Play className="ml-0.5 h-7 w-7 text-black md:h-9 md:w-9" fill="currentColor" />
        </div>
      </div>
    </div>
  );
}

/* ─── Main Export ─── */
export function VidStackPlayer(props: VidStackPlayerProps) {
  const { url, title, poster, className, playing, muted, startTime, hideBranding, thumbnail } = props;
  const [mini, setMini] = useState(false);
  const [showPlayer, setShowPlayer] = useState(!hideBranding);
  const [userPlayed, setUserPlayed] = useState(false);

  if (!url) {
    return (
      <div className={cn("flex items-center justify-center rounded-2xl bg-black/40 aspect-video", className)}>
        <p className="text-xs text-white/30 font-medium">No video source</p>
      </div>
    );
  }

  const streamUrl = resolveStreamUrl(url);
  const videoId = extractYouTubeId(url);
  const thumbUrl = thumbnail || (videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : poster || null);
  const shouldAutoPlay = userPlayed ? true : playing;

  // Show play overlay before user interacts
  if (!showPlayer) {
    return (
      <div className={cn("relative", className)}>
        <PlayOverlay thumbnail={thumbUrl} onPlay={() => { setShowPlayer(true); setUserPlayed(true); }} />
      </div>
    );
  }

  // YouTube → YouTube embed
  if (videoId) {
    if (mini) {
      return <MiniPlayer url={streamUrl} videoId={videoId} title={title} poster={poster} muted={muted} onExpand={() => setMini(false)} />;
    }
    return (
      <div className={cn("relative", className)}>
        <NativeYouTubePlayer videoId={videoId} title={title} playing={shouldAutoPlay} startTime={startTime} />
        {!mini && (
          <button onClick={() => setMini(true)}
            className="absolute top-3 right-3 z-10 w-7 h-7 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-all flex items-center justify-center opacity-0 hover:opacity-100">
            <Shrink size={12} />
          </button>
        )}
      </div>
    );
  }

  // MP4 / HLS / Drive proxy → VidStack
  if (mini) {
    return <MiniPlayer url={streamUrl} videoId={null} title={title} poster={poster} muted={muted} onExpand={() => setMini(false)} />;
  }
  return (
    <div className={cn("aspect-video overflow-hidden rounded-2xl bg-black group", className)}>
      <VidStackNative url={streamUrl} title={title} poster={poster} playing={shouldAutoPlay} muted={muted} startTime={startTime} onMini={() => setMini(true)} />
    </div>
  );
}

/* ─── Helpers ─── */
function extractYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|v\/))([a-zA-Z0-9_-]{11})/);
  return m?.[1] ?? null;
}

function resolveStreamUrl(url: string): string {
  if (extractYouTubeId(url)) return url;
  if (url.includes(".m3u8")) return url;
  const driveId = url.match(/drive\.google\.com\/(?:file\/d\/|open\?id=)([^/&?]+)/)?.[1];
  if (driveId) return `/api/v1/drive/stream?id=${driveId}`;
  if (url.includes('t.me/') || url.includes('telegram.me/')) {
    return `/api/v1/telegram/stream-public-post?url=${encodeURIComponent(url)}`;
  }
  return url;
}
