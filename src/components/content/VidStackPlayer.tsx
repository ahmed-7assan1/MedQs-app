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

import { useState, useRef, useCallback, useEffect } from "react";
import {
  MediaPlayer, MediaOutlet, MediaCommunitySkin,
  MediaGesture, MediaCaptions, MediaPIPButton,
  MediaPlayButton, MediaTimeSlider,
} from "@vidstack/react";
import { cn } from "@/lib/utils";
import { Shrink, PictureInPicture2, Expand, Play, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface VidStackPlayerProps {
  url: string;
  title?: string;
  poster?: string;
  className?: string;
  playing?: boolean;
  muted?: boolean;
  startTime?: number;
}

/* ─── YouTube Embed Player (VidStack doesn't support YouTube in v0.6) ─── */
function YouTubeEmbed({ videoId, title, playing, startTime, onReady }: {
  videoId: string; title?: string; playing?: boolean; startTime?: number; onReady?: () => void;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loaded, setLoaded] = useState(false);

  const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=${playing ? 1 : 0}&rel=0&modestbranding=1&playsinline=1${startTime ? `&start=${Math.floor(startTime)}` : ""}&enablejsapi=1`;

  return (
    <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden">
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-white/30" />
        </div>
      )}
      <iframe
        ref={iframeRef}
        src={embedUrl}
        title={title || "YouTube video"}
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
        className={cn("absolute inset-0 w-full h-full", loaded ? "opacity-100" : "opacity-0")}
        onLoad={() => { setLoaded(true); onReady?.(); }}
      />
    </div>
  );
}

/* ─── VidStack Native Player (MP4, HLS, Drive proxy) ─── */
function VidStackNative({ url, title, poster, playing, muted, startTime, onMini }: {
  url: string; title?: string; poster?: string; playing?: boolean; muted?: boolean;
  startTime?: number; onMini: () => void;
}) {
  return (
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
      className="fixed bottom-4 right-4 z-[999] w-80 aspect-video rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-black cursor-grab active:cursor-grabbing"
    >
      <div onMouseDown={onDragStart} className="absolute inset-0">
        {videoId ? (
          <iframe
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`}
            className="w-full h-full pointer-events-none"
            allow="autoplay"
          />
        ) : (
          <MediaPlayer
            src={url} poster={poster} title={title} autoplay muted={muted}
            load="visible" streamType="on-demand" viewType="video"
            style={{ width: "100%", height: "100%" }}
          >
            <MediaOutlet />
          </MediaPlayer>
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

/* ─── Main Export ─── */
export function VidStackPlayer(props: VidStackPlayerProps) {
  const { url, title, poster, className, playing, muted, startTime } = props;
  const [mini, setMini] = useState(false);

  if (!url) {
    return (
      <div className={cn("flex items-center justify-center rounded-2xl bg-black/40 aspect-video", className)}>
        <p className="text-xs text-white/30 font-medium">No video source</p>
      </div>
    );
  }

  const streamUrl = resolveStreamUrl(url);
  const videoId = extractYouTubeId(url);

  // YouTube → YouTube embed
  if (videoId) {
    if (mini) {
      return <MiniPlayer url={streamUrl} videoId={videoId} title={title} poster={poster} muted={muted} onExpand={() => setMini(false)} />;
    }
    return (
      <div className={cn("relative", className)}>
        <YouTubeEmbed videoId={videoId} title={title} playing={playing} startTime={startTime} />
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
      <VidStackNative url={streamUrl} title={title} poster={poster} playing={playing} muted={muted} startTime={startTime} onMini={() => setMini(true)} />
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
  return url;
}
