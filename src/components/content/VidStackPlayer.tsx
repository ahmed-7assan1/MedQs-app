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

import "plyr/dist/plyr.css";

import React, { useState, useRef, useCallback, useEffect, Component } from "react";
// @ts-expect-error — plyr types are ambient declarations; runtime exports default
import Plyr from "plyr";

class VidStackErrorBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    return this.state.hasError ? null : this.props.children;
  }
}
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

/* ─── Heroicons SVG sprite (replaces Plyr default icons) ─── */
function createHeroiconSprite(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg"><defs>
<path id="plyr-play" d="M4.5 5.653c0-1.427 1.529-2.33 2.779-1.643l11.54 6.347c1.295.712 1.295 2.573 0 3.286L7.28 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653Z"/>
<path id="plyr-pause" d="M6.75 5.25a.75.75 0 0 1 .75-.75H9a.75.75 0 0 1 .75.75v13.5a.75.75 0 0 1-.75.75H7.5a.75.75 0 0 1-.75-.75V5.25Zm7.5 0A.75.75 0 0 1 15 4.5h1.5a.75.75 0 0 1 .75.75v13.5a.75.75 0 0 1-.75.75H15a.75.75 0 0 1-.75-.75V5.25Z"/>
<path id="plyr-volume" d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 0 0 1.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06ZM18.584 5.106a.75.75 0 0 1 1.06 0c3.808 3.807 3.808 9.98 0 13.788a.75.75 0 0 1-1.06-1.06 8.25 8.25 0 0 0 0-11.668.75.75 0 0 1 0-1.06Z"/>
<path id="plyr-muted" d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 0 0 1.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06ZM17.78 9.22a.75.75 0 1 0-1.06 1.06L18.44 12l-1.72 1.72a.75.75 0 1 0 1.06 1.06l1.72-1.72 1.72 1.72a.75.75 0 1 0 1.06-1.06L20.56 12l1.72-1.72a.75.75 0 1 0-1.06-1.06l-1.72 1.72-1.72-1.72Z"/>
<path id="plyr-fullscreen-enter" d="M15 3.75a.75.75 0 0 1 .75-.75h4.5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0V5.56l-3.97 3.97a.75.75 0 1 1-1.06-1.06l3.97-3.97h-2.69a.75.75 0 0 1-.75-.75Zm-12 0A.75.75 0 0 1 3.75 3h4.5a.75.75 0 0 1 0 1.5H5.56l3.97 3.97a.75.75 0 0 1-1.06 1.06L4.5 5.56v2.69a.75.75 0 0 1-1.5 0v-4.5Zm11.47 11.78a.75.75 0 1 1 1.06-1.06l3.97 3.97v-2.69a.75.75 0 0 1 1.5 0v4.5a.75.75 0 0 1-.75.75h-4.5a.75.75 0 0 1 0-1.5h2.69l-3.97-3.97Zm-4.94-1.06a.75.75 0 0 1 0 1.06L5.56 19.5h2.69a.75.75 0 0 1 0 1.5h-4.5a.75.75 0 0 1-.75-.75v-4.5a.75.75 0 0 1 1.5 0v2.69l3.97-3.97a.75.75 0 0 1 1.06 0Z"/>
<path id="plyr-fullscreen-exit" d="M3.22 3.22a.75.75 0 0 1 1.06 0l3.97 3.97V4.5a.75.75 0 0 1 1.5 0V9a.75.75 0 0 1-.75.75H4.5a.75.75 0 0 1 0-1.5h2.69L3.22 4.28a.75.75 0 0 1 0-1.06Zm17.56 0a.75.75 0 0 1 0 1.06l-3.97 3.97h2.69a.75.75 0 0 1 0 1.5H15a.75.75 0 0 1-.75-.75V4.5a.75.75 0 0 1 1.5 0v2.69l3.97-3.97a.75.75 0 0 1 1.06 0ZM3.75 15a.75.75 0 0 1 .75-.75H9a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-2.69l-3.97 3.97a.75.75 0 0 1-1.06-1.06l3.97-3.97H4.5a.75.75 0 0 1-.75-.75Zm10.5 0a.75.75 0 0 1 .75-.75h4.5a.75.75 0 0 1 0 1.5h-2.69l3.97 3.97a.75.75 0 1 1-1.06 1.06l-3.97-3.97v2.69a.75.75 0 0 1-1.5 0V15Z"/>
</defs></svg>`;
}

/* ─── YouTube Player (Plyr) ─── */
function PlyrYouTubePlayer({ videoId, title, playing, startTime }: {
  videoId: string; title?: string; playing?: boolean; startTime?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const plyrRef = useRef<any>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const video = document.createElement("video");
    video.className = "plyr-react plyr";
    container.appendChild(video);

    // Create Heroicons sprite as blob URL
    const blob = new Blob([createHeroiconSprite()], { type: "image/svg+xml" });
    const iconUrl = URL.createObjectURL(blob);

    const player = new Plyr(video, {
      controls: ["play-large", "play", "progress", "mute", "volume", "fullscreen"],
      autoplay: playing ?? false,
      invertTime: false,
      disableContextMenu: true,
      clickToPlay: true,
      iconUrl,
      youtube: {
        rel: 0,
        iv_load_policy: 3,
        modestbranding: 1,
        customControls: true,
        noCookie: true,
        ...(startTime ? { start: Math.floor(startTime) } : {}),
      },
    });

    player.source = {
      type: "video",
      sources: [{ src: videoId, provider: "youtube" }],
      title,
    };

    plyrRef.current = player;
    setReady(true);

    return () => {
      URL.revokeObjectURL(iconUrl);
      if (plyrRef.current) {
        try { plyrRef.current.destroy(); } catch {}
        plyrRef.current = null;
      }
      (window as any).onYouTubeIframeAPIReady = undefined;
    };
  }, [videoId]);

  return (
    <div
      className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden"
      style={{
        "--plyr-color-main": "#fff",
        "--plyr-video-controls-background": "linear-gradient(transparent, rgba(0,0,0,0.7))",
        "--plyr-video-control-color": "#fff",
        "--plyr-video-control-background-hover": "rgba(255,255,255,0.15)",
        "--plyr-video-control-color-hover": "#fff",
        "--plyr-video-progress-buffered-background": "rgba(255,255,255,0.25)",
        "--plyr-range-fill-background": "#fff",
        "--plyr-range-track-height": "3px",
        "--plyr-range-thumb-height": "0px",
        "--plyr-range-thumb-background": "#fff",
        "--plyr-video-background": "#000",
      } as React.CSSProperties}
    >
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <Loader2 className="h-8 w-8 animate-spin text-white/30" />
        </div>
      )}
      <div ref={containerRef} className={cn("w-full h-full", ready ? "opacity-100" : "opacity-0")} />
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
        <PlyrYouTubePlayer videoId={videoId} title={title} playing={playing} startTime={startTime} />
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
