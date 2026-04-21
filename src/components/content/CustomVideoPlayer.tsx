"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Play, Pause, Volume2, VolumeX, Maximize, Minimize,
  Settings, Check, Gauge, RotateCcw, Languages, ChevronRight, ArrowLeft, CheckCircle2,
  VideoOff
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

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

function mapYouTubeQuality(q: string): string {
  const map: Record<string, string> = {
    highres: "4K/8K",
    hd2160: "2160p (4K)",
    hd1440: "1440p (2K)",
    hd1080: "1080p",
    hd720: "720p",
    large: "480p",
    medium: "360p",
    small: "240p",
    tiny: "144p",
    auto: "Auto"
  };
  return map[q] || q;
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
  const [mounted, setMounted] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [buffering, setBuffering] = useState(false);
  const [buffered, setBuffered] = useState(0);
  const [playbackRestricted, setPlaybackRestricted] = useState(false);

  const ytPlayerRef = useRef<any>(null);
  const progressTimer = useRef<ReturnType<typeof setInterval>>();

  const [showSettings, setShowSettings] = useState(false);
  const [settingsView, setSettingsView] = useState<"main" | "quality" | "speed" | "captions">("main");
  const [availableQualities, setAvailableQualities] = useState<string[]>([]);
  const [availableRates, setAvailableRates] = useState<number[]>([]);
  const [captionTracks, setCaptionTracks] = useState<any[]>([]);
  const [currentTrackCode, setCurrentTrackCode] = useState<string | null>(null);
  const [selectedQuality, setSelectedQuality] = useState<string>("auto");

  const ytId = extractYouTubeId(url);
  const driveId = extractGoogleDriveId(url);
  const isHtml5 = !ytId && !driveId && /\.(mp4|webm|ogg)$/i.test(url);

  useEffect(() => {
    setMounted(true);

    // Pre-load YouTube API script globally
    if (typeof window !== "undefined" && !document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(tag);
    }

    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFsChange);
    return () => {
      document.removeEventListener("fullscreenchange", onFsChange);
      if (progressTimer.current) clearInterval(progressTimer.current);
      if (hideTimeout.current) clearTimeout(hideTimeout.current);
    };
  }, []);

  useEffect(() => {
    if (!ytId || !mounted || !iframeLoaded) return;

    const initPlayer = () => {
      if (!iframeRef.current || !ytId) return;

      ytPlayerRef.current = new (window as any).YT.Player(iframeRef.current, {
        videoId: ytId,
        playerVars: {
          autoplay: playing ? 1 : 0,
          controls: 0,
          rel: 0,
          modestbranding: 1,
          enablejsapi: 1,
          origin: typeof window !== "undefined" ? window.location.origin : undefined,
          widget_referrer: typeof window !== "undefined" ? window.location.href : undefined,
        },
        events: {
          onReady: (event: any) => {
            setDuration(event.target.getDuration?.() ?? 0);
            event.target.setVolume(volume * 100);
            setVideoReady(true); // Show the iframe as soon as it's ready

            // Fetch initial settings
            const rawQualities = event.target.getAvailableQualityLevels?.() ?? [];
            setAvailableQualities(rawQualities.filter((q: string) => q !== "auto"));
            setAvailableRates(event.target.getAvailablePlaybackRates?.() ?? [1, 1.25, 1.5, 2]);

            // Autoplay logic
            if (playing) {
              event.target.unMute();
              event.target.playVideo();
            }
          },
          onStateChange: (e: any) => {
            const YT = (window as any).YT;
            if (e.data === YT.PlayerState.PLAYING) {
              setPlaying(true);
              setVideoReady(true);
              setBuffering(false);
              ytPlayerRef.current?.unMute();
              setDuration(ytPlayerRef.current?.getDuration?.() ?? 0);

              // Update qualities in case they changed
              const rawQualities = ytPlayerRef.current?.getAvailableQualityLevels?.() ?? [];
              setAvailableQualities(rawQualities.filter((q: string) => q !== "auto"));

              if (progressTimer.current) clearInterval(progressTimer.current);
              progressTimer.current = setInterval(() => {
                const cur = ytPlayerRef.current?.getCurrentTime?.() ?? 0;
                const dur = ytPlayerRef.current?.getDuration?.() ?? 1;
                const loaded = ytPlayerRef.current?.getVideoLoadedFraction?.() ?? 0;
                setPlayed(cur / dur);
                setBuffered(loaded);
              }, 250);
            } else if (e.data === YT.PlayerState.BUFFERING) {
              setPlaying(false);
              setBuffering(true);
            } else if (e.data === YT.PlayerState.ENDED) {
              setPlaying(false);
              setVideoReady(false);
              setIframeLoaded(false); // Kill and reset to thumbnail
            } else if (e.data === YT.PlayerState.PAUSED) {
              setPlaying(false);
              setBuffering(false);
              if (progressTimer.current) clearInterval(progressTimer.current);
            }
          },
          onError: (e: any) => {
            // 101 or 150 means owner disabled playback in embedded players
            if (e.data === 150 || e.data === 101) {
              setPlaybackRestricted(true);
            }
          }
        },
      });
    };

    if ((window as any).YT?.Player) {
      initPlayer();
    } else {
      const existingCallback = (window as any).onYouTubeIframeAPIReady;
      (window as any).onYouTubeIframeAPIReady = () => {
        if (existingCallback) existingCallback();
        initPlayer();
      };
    }

    return () => {
      if (progressTimer.current) clearInterval(progressTimer.current);
      try { ytPlayerRef.current?.destroy?.(); } catch (_) { }
      ytPlayerRef.current = null;
    };
  }, [ytId, mounted, iframeLoaded]);

  const resetHideTimer = useCallback(() => {
    setShowControls(true);
    if (hideTimeout.current) clearTimeout(hideTimeout.current);
    if (playing) {
      hideTimeout.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  }, [playing]);

  const togglePlayPause = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (ytId) {
      if (!iframeLoaded) {
        setIframeLoaded(true);
        setPlaying(true);
        return;
      }
      if (playing) {
        ytPlayerRef.current?.pauseVideo();
      } else {
        ytPlayerRef.current?.unMute();
        ytPlayerRef.current?.playVideo();
      }
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

  const cyclePlaybackRate = (e: React.MouseEvent) => {
    e.stopPropagation();
    const rates = availableRates.length > 0 ? availableRates : [0.75, 1, 1.25, 1.5, 2];
    const nextIdx = (rates.indexOf(playbackRate) + 1) % rates.length;
    const next = rates[nextIdx];
    setPlaybackRate(next);
    if (ytId && ytPlayerRef.current) ytPlayerRef.current.setPlaybackRate(next);
    else if (videoRef.current) videoRef.current.playbackRate = next;
  };

  const updateQuality = (q: string) => {
    setSelectedQuality(q);
    if (ytId && ytPlayerRef.current) {
      ytPlayerRef.current.setPlaybackQuality(q);
      // Force re-buffer
      const cur = ytPlayerRef.current.getCurrentTime?.() ?? 0;
      ytPlayerRef.current.seekTo(cur, true);
    }
    setSettingsView("main");
  };

  const updateRate = (r: number) => {
    setPlaybackRate(r);
    if (ytId && ytPlayerRef.current) ytPlayerRef.current.setPlaybackRate(r);
    else if (videoRef.current) videoRef.current.playbackRate = r;
    setSettingsView("main");
  };

  const toggleCaption = (track: any) => {
    if (ytId && ytPlayerRef.current) {
      if (track === null) {
        ytPlayerRef.current.unloadModule("captions");
        ytPlayerRef.current.unloadModule("cc");
        setCurrentTrackCode(null);
      } else {
        ytPlayerRef.current.loadModule("captions");
        ytPlayerRef.current.setOption("captions", "track", { languageCode: track.languageCode });
        setCurrentTrackCode(track.languageCode);
      }
    }
    setSettingsView("main");
  };

  const handleSettingsToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!showSettings && ytId && ytPlayerRef.current) {
      // Refresh options when opening
      setAvailableQualities(ytPlayerRef.current.getAvailableQualityLevels?.() ?? []);
      setAvailableRates(ytPlayerRef.current.getAvailablePlaybackRates?.() ?? []);
      try {
        const tracks = ytPlayerRef.current.getOption?.("captions", "tracklist") ?? [];
        setCaptionTracks(tracks);
      } catch (_) { }
    }
    setShowSettings(!showSettings);
    setSettingsView("main");
  };

  const toggleFullscreen = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!wrapperRef.current) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else wrapperRef.current.requestFullscreen();
  };

  const [hoverPosition, setHoverPosition] = useState<number | null>(null);

  const handleProgressHover = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    setHoverPosition(Math.max(0, Math.min(1, pos)));
  };

  const handleProgressLeave = () => {
    setHoverPosition(null);
  };

  if (!mounted) return <div className="aspect-video w-full animate-pulse bg-neutral-900 rounded-xl" />;

  return (
    <div
      ref={wrapperRef}
      className="relative flex h-full w-full flex-col overflow-hidden bg-black rounded-[14px]"
      style={{ aspectRatio: "16/9" }}
      onMouseMove={resetHideTimer}
      onMouseLeave={() => {
        if (playing) setShowControls(false);
        setShowSettings(false);
        setHoverPosition(null);
      }}
      onClick={() => setShowSettings(false)}
    >
      {/* ... previous video layers ... */}
      {/* 2. CENTER BUFFERING RING ... */}
      {/* 4. CUSTOM CONTROLS OVERLAY */}
      <div
        className={cn(
          "absolute inset-x-0 bottom-0 z-50 transition-all duration-300 px-4 pb-4 md:pb-6",
          showControls ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
        )}
        style={{ background: "linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.4) 70%, transparent 100%)", height: "auto", minHeight: "120px" }}
      >
        {/* ... Row 1: Controls ... */}
        {/* Row 2: Progress Bar (Now BOTTOM) */}
        <div 
          className="group relative flex h-1.5 cursor-pointer items-center rounded-full bg-white/10 transition-all hover:h-2"
          onMouseMove={handleProgressHover}
          onMouseLeave={handleProgressLeave}
        >
          {/* Seek Preview Overlay */}
          <AnimatePresence>
            {hoverPosition !== null && duration > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.9 }}
                animate={{ opacity: 1, y: -20, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.9 }}
                className="absolute z-50 flex flex-col items-center gap-2 pointer-events-none"
                style={{ left: `${hoverPosition * 100}%`, transform: "translateX(-50%)" }}
              >
                {/* Thumbnail Preview */}
                <div className="w-32 md:w-40 aspect-video rounded-xl overflow-hidden border-2 border-white/20 shadow-2xl bg-black">
                  {ytId ? (
                    <img 
                      src={`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`} 
                      className="w-full h-full object-cover"
                      alt="Preview"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-neutral-800">
                      <Play className="h-6 w-6 text-white/20" />
                    </div>
                  )}
                  {/* Timestamp Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-black/60 backdrop-blur-md px-2 py-0.5 rounded text-[11px] font-bold text-white border border-white/10">
                      {formatTime(hoverPosition * duration)}
                    </div>
                  </div>
                </div>
                {/* Carrot */}
                <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-white/20" />
              </motion.div>
            )}
          </AnimatePresence>

          <div
            className="pointer-events-none absolute left-0 top-0 h-full rounded-full bg-white/10"
            style={{ width: `${buffered * 100}%` }}
          />
          <div
            className="pointer-events-none absolute left-0 top-0 h-full rounded-full bg-red-600 transition-all"
            style={{ width: `${played * 100}%` }}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 h-3 w-3 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
          </div>
          <input
            type="range" min={0} max={1} step="any" value={played}
            onChange={handleSeek}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
}

