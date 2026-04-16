"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Play, Pause, Volume2, VolumeX, Maximize, Minimize,
  Settings, Check, Gauge
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CustomVideoPlayerProps {
  url: string;
  title?: string;
}

const formatTime = (seconds: number) => {
  if (!seconds || isNaN(seconds)) return "0:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
};

function extractYouTubeId(url: string): string | null {
  const match = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|v\/))([a-zA-Z0-9_-]{11})/
  );
  return match ? match[1] : null;
}

function extractGoogleDriveId(url: string): string | null {
  const match = url.match(/drive\.google\.com\/file\/d\/([^/]+)/);
  return match ? match[1] : null;
}

export function CustomVideoPlayer({ url, title }: CustomVideoPlayerProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hideTimeout = useRef<ReturnType<typeof setTimeout>>();

  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [played, setPlayed] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [buffering, setBuffering] = useState(false);

  const ytPlayerRef = useRef<any>(null);
  const progressTimer = useRef<ReturnType<typeof setInterval>>();

  const ytId = extractYouTubeId(url);
  const driveId = extractGoogleDriveId(url);
  const isHtml5 = !ytId && !driveId && /\.(mp4|webm|ogg)$/i.test(url);

  // YouTube thumbnail (high-res, then fallback)
  const ytThumb = ytId ? `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg` : null;
  const ytThumbFallback = ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : null;

  useEffect(() => {
    setMounted(true);
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFsChange);
    return () => {
      document.removeEventListener("fullscreenchange", onFsChange);
      if (progressTimer.current) clearInterval(progressTimer.current);
      if (hideTimeout.current) clearTimeout(hideTimeout.current);
    };
  }, []);

  // YouTube IFrame API — only after first play click
  useEffect(() => {
    if (!ytId || !mounted || !iframeLoaded) return;

    const initPlayer = () => {
      if (!iframeRef.current) return;
      ytPlayerRef.current = new (window as any).YT.Player(iframeRef.current, {
        events: {
          onReady: (event: any) => {
            setDuration(event.target.getDuration?.() ?? 0);
            event.target.setVolume(volume * 100);
            event.target.playVideo();
          },
          onStateChange: (e: any) => {
            const YT = (window as any).YT;
            if (e.data === YT.PlayerState.PLAYING) {
              setPlaying(true);
              setBuffering(false);
              setDuration(ytPlayerRef.current?.getDuration?.() ?? 0);
              if (progressTimer.current) clearInterval(progressTimer.current);
              progressTimer.current = setInterval(() => {
                const cur = ytPlayerRef.current?.getCurrentTime?.() ?? 0;
                const dur = ytPlayerRef.current?.getDuration?.() ?? 1;
                setPlayed(cur / dur);
              }, 250);
            } else if (e.data === YT.PlayerState.BUFFERING) {
              setBuffering(true);
            } else {
              setPlaying(false);
              setBuffering(false);
              if (progressTimer.current) clearInterval(progressTimer.current);
            }
          },
        },
      });
    };

    if ((window as any).YT?.Player) {
      initPlayer();
    } else {
      // Remove old listener if any
      (window as any).onYouTubeIframeAPIReady = initPlayer;
      if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
        const tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(tag);
      }
    }

    return () => {
      if (progressTimer.current) clearInterval(progressTimer.current);
      try { ytPlayerRef.current?.destroy?.(); } catch (_) { }
      ytPlayerRef.current = null;
    };
  }, [ytId, mounted, iframeLoaded]);

  // Auto-hide controls
  const resetHideTimer = useCallback(() => {
    setShowControls(true);
    if (hideTimeout.current) clearTimeout(hideTimeout.current);
    if (playing) {
      hideTimeout.current = setTimeout(() => {
        if (!showSettings) setShowControls(false);
      }, 3000);
    }
  }, [playing, showSettings]);

  const togglePlayPause = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (ytId) {
      if (!iframeLoaded) {
        setIframeLoaded(true);
        setPlaying(true);
        return;
      }
      if (playing) ytPlayerRef.current?.pauseVideo();
      else ytPlayerRef.current?.playVideo();
    } else if (videoRef.current) {
      if (playing) videoRef.current.pause();
      else videoRef.current.play();
    }
  }, [ytId, iframeLoaded, playing]);

  const handleMuteToggle = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    const next = !muted;
    setMuted(next);
    if (ytId && ytPlayerRef.current) {
      next ? ytPlayerRef.current.mute() : ytPlayerRef.current.unMute();
    } else if (videoRef.current) {
      videoRef.current.muted = next;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    setMuted(v === 0);
    if (ytId && ytPlayerRef.current) {
      ytPlayerRef.current.setVolume(v * 100);
      if (v > 0) ytPlayerRef.current.unMute();
    } else if (videoRef.current) {
      videoRef.current.volume = v;
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setPlayed(val);
    if (ytId && ytPlayerRef.current) {
      const dur = ytPlayerRef.current.getDuration?.() ?? 0;
      ytPlayerRef.current.seekTo(val * dur, true);
    } else if (videoRef.current && duration > 0) {
      videoRef.current.currentTime = val * duration;
    }
  };

  const handleSpeedChange = (rate: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setPlaybackRate(rate);
    setShowSettings(false);
    if (ytId && ytPlayerRef.current) ytPlayerRef.current.setPlaybackRate(rate);
    else if (videoRef.current) videoRef.current.playbackRate = rate;
  };

  const toggleFullscreen = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!wrapperRef.current) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else wrapperRef.current.requestFullscreen();
  };

  if (!mounted) return <div className="aspect-video w-full animate-pulse bg-neutral-900 rounded-xl" />;

  return (
    <div
      ref={wrapperRef}
      className="relative flex h-full w-full flex-col overflow-hidden bg-black"
      onMouseMove={resetHideTimer}
      onMouseLeave={() => { if (playing && !showSettings) setShowControls(false); }}
    >
      {/* ═══════════════ VIDEO LAYER ═══════════════ */}

      {ytId ? (
        <>
          {/* Thumbnail — shown before first play, no YouTube logo */}
          <div
            className={cn(
              "absolute inset-0 z-0 transition-opacity duration-300",
              iframeLoaded ? "opacity-0 pointer-events-none" : "opacity-100"
            )}
          >
            <img
              src={ytThumb!}
              onError={(e) => { (e.target as HTMLImageElement).src = ytThumbFallback!; }}
              alt={title ?? "Video thumbnail"}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-black/40" />
          </div>

          {/* Iframe — injected after first play click, slightly oversized to clip YouTube UI */}
          {iframeLoaded && (
            <div className="absolute inset-0 overflow-hidden">
              <iframe
                ref={iframeRef}
                id={`yt-${ytId}`}
                src={`https://www.youtube.com/embed/${ytId}?enablejsapi=1&controls=0&rel=0&modestbranding=1&playsinline=1&showinfo=0&iv_load_policy=3&disablekb=1&fs=0&origin=${window.location.origin}`}
                className="absolute border-0"
                style={{ top: "-60px", left: "-2px", right: "-2px", bottom: "-60px", width: "calc(100% + 4px)", height: "calc(100% + 120px)", pointerEvents: "none" }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
                allowFullScreen
              />
            </div>
          )}

          {/* Click interceptor — always on top of iframe */}
          <div className="absolute inset-0 z-20 cursor-pointer" onClick={togglePlayPause} />
        </>
      ) : driveId ? (
        <iframe
          src={`https://drive.google.com/file/d/${driveId}/preview`}
          className="absolute inset-0 h-full w-full border-0"
          allow="autoplay" allowFullScreen
        />
      ) : isHtml5 ? (
        <video
          ref={videoRef}
          src={url}
          className="absolute inset-0 h-full w-full"
          playsInline
          onTimeUpdate={() => {
            if (videoRef.current && duration > 0) setPlayed(videoRef.current.currentTime / duration);
          }}
          onLoadedMetadata={() => setDuration(videoRef.current?.duration ?? 0)}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
          onWaiting={() => setBuffering(true)}
          onCanPlay={() => setBuffering(false)}
        />
      ) : (
        <iframe src={url} className="absolute inset-0 h-full w-full border-0" allowFullScreen />
      )}

      {/* ═══════════════ BIG PLAY BUTTON ═══════════════ */}
      {(ytId || isHtml5) && !playing && (
        <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center">
          <div
            className="group relative flex h-20 w-20 items-center justify-center rounded-full shadow-2xl transition-transform duration-200"
            style={{ background: "rgba(220,38,38,0.92)", backdropFilter: "blur(8px)" }}
          >
            {/* Pulse ring */}
            <div className="absolute inset-0 rounded-full bg-red-500/30 animate-ping" />
            <Play className="relative h-9 w-9 fill-white ml-1.5 drop-shadow" />
          </div>
        </div>
      )}

      {/* Buffering spinner */}
      {buffering && playing && (
        <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center">
          <div className="h-12 w-12 rounded-full border-4 border-white/20 border-t-red-500 animate-spin" />
        </div>
      )}

      {/* ═══════════════ CONTROLS OVERLAY ═══════════════ */}
      {(ytId || isHtml5) && (
        <div
          className={cn(
            "absolute inset-x-0 bottom-0 z-40 flex flex-col justify-end transition-all duration-300",
            showControls ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"
          )}
          style={{ background: "linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.5) 50%, transparent 100%)", paddingBottom: "12px", paddingTop: "48px" }}
        >
          {/* ── Progress bar ── */}
          <div className="group/bar relative mx-3 mb-3 flex h-1.5 cursor-pointer items-center rounded-full bg-white/20">
            {/* Played */}
            <div
              className="pointer-events-none absolute left-0 top-0 h-full rounded-full bg-red-500 transition-all"
              style={{ width: `${played * 100}%` }}
            />
            {/* Thumb dot */}
            <div
              className="pointer-events-none absolute -top-[3px] h-3.5 w-3.5 -translate-x-1/2 rounded-full bg-red-500 shadow-lg opacity-0 transition-opacity group-hover/bar:opacity-100"
              style={{ left: `${played * 100}%` }}
            />
            <input
              type="range" min={0} max={0.9999} step="any" value={played}
              onChange={handleSeek}
              onClick={(e) => e.stopPropagation()}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            />
          </div>

          {/* ── Bottom row ── */}
          <div className="flex items-center justify-between px-3 text-white">
            {/* Left */}
            <div className="flex items-center gap-1">
              {/* Play/Pause */}
              <button
                onClick={togglePlayPause}
                className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-white/15"
              >
                {playing
                  ? <Pause className="h-[18px] w-[18px] fill-white" />
                  : <Play className="h-[18px] w-[18px] fill-white ml-0.5" />}
              </button>

              {/* Volume */}
              <div className="group/vol flex items-center gap-1">
                <button
                  onClick={handleMuteToggle}
                  className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-white/15"
                >
                  {muted || volume === 0
                    ? <VolumeX className="h-[18px] w-[18px]" />
                    : <Volume2 className="h-[18px] w-[18px]" />}
                </button>
                <div className="w-0 overflow-hidden opacity-0 transition-all duration-200 group-hover/vol:w-20 group-hover/vol:opacity-100">
                  <input
                    type="range" min={0} max={1} step="any" value={muted ? 0 : volume}
                    onChange={handleVolumeChange}
                    onClick={(e) => e.stopPropagation()}
                    className="h-1 w-20 cursor-pointer accent-red-500"
                  />
                </div>
              </div>

              {/* Time */}
              <span className="ml-1 text-[11px] font-medium tabular-nums text-white/80 select-none">
                {formatTime(duration * played)} <span className="text-white/40">/</span> {formatTime(duration)}
              </span>
            </div>

            {/* Right */}
            <div className="relative flex items-center gap-1">
              {/* Speed indicator badge */}
              {playbackRate !== 1 && (
                <span className="rounded bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  {playbackRate}x
                </span>
              )}

              {/* Settings popup */}
              {showSettings && (
                <div
                  className="absolute bottom-11 right-8 z-50 min-w-[130px] rounded-2xl border border-white/10 bg-black/95 p-1.5 shadow-2xl backdrop-blur-md"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="mb-1 flex items-center gap-1.5 px-3 py-1.5">
                    <Gauge className="h-3 w-3 text-red-400" />
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-white/50">Speed</span>
                  </div>
                  {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map((rate) => (
                    <button
                      key={rate}
                      onClick={(e) => handleSpeedChange(rate, e)}
                      className={cn(
                        "flex w-full items-center justify-between rounded-xl px-3 py-1.5 text-sm transition-colors",
                        playbackRate === rate ? "bg-red-500/20 text-red-400" : "text-white/80 hover:bg-white/10"
                      )}
                    >
                      <span>{rate === 1 ? "Normal" : `${rate}×`}</span>
                      {playbackRate === rate && <Check className="h-3.5 w-3.5" />}
                    </button>
                  ))}
                </div>
              )}

              {/* Settings button */}
              <button
                onClick={(e) => { e.stopPropagation(); setShowSettings((s) => !s); }}
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-white/15",
                  showSettings && "bg-white/20 text-red-400"
                )}
              >
                <Settings className="h-[18px] w-[18px]" />
              </button>

              {/* Fullscreen */}
              <button
                onClick={toggleFullscreen}
                className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-white/15"
              >
                {isFullscreen ? <Minimize className="h-[18px] w-[18px]" /> : <Maximize className="h-[18px] w-[18px]" />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
