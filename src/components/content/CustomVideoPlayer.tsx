"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Play, Pause, Volume2, VolumeX, Maximize, Minimize,
  Settings, Check, Gauge, RotateCcw, Languages, ChevronRight, ArrowLeft, CheckCircle2
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
      }}
      onClick={() => setShowSettings(false)}
    >
      {/* 1. VIDEO LAYER */}
      {ytId ? (
        <>
          <div className="absolute inset-0 z-0 select-none">
            <img
              src={`https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`}
              className={cn("h-full w-full object-cover transition-opacity duration-700", videoReady ? "opacity-0" : "opacity-100")}
            />
            <div className={cn("absolute inset-0 bg-black/40 transition-opacity", videoReady ? "opacity-0" : "opacity-100")} />
          </div>

          {iframeLoaded && (
            <div className={cn(
              "absolute inset-0 overflow-hidden bg-black transition-opacity duration-1000",
              videoReady ? "opacity-100 scale-100" : "opacity-0 scale-105"
            )}>
              <div
                ref={iframeRef as any}
                className="absolute border-0 pointer-events-none transition-all duration-700 ease-in-out"
                style={(!playing || buffering) ? {
                  top: "0%", left: "-10%",
                  width: "120%", height: "135%",
                  transform: "scale(1.05)"
                } : {
                  top: "0%", left: "0%",
                  width: "100%", height: "100%",
                  transform: "scale(1)"
                }}
              />
            </div>
          )}

          {/* Loading Shield (Gradient mask from bottom to top) */}
          <div 
            className={cn(
              "absolute inset-x-0 bottom-0 z-40 transition-all duration-500 pointer-events-none",
              (!playing || buffering) ? "opacity-100 h-1/2" : "opacity-0 h-0"
            )}
            style={{ background: "linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0.8) 20%, rgba(0,0,0,0.4) 50%, transparent 100%)" }}
          />

          <div className="absolute inset-0 z-30 cursor-pointer" onClick={togglePlayPause} />
        </>
      ) : isHtml5 ? (
        <video
          ref={videoRef}
          src={url}
          className="absolute inset-0 h-full w-full"
          playsInline
          onTimeUpdate={() => {
            if (videoRef.current && duration > 0) {
              setPlayed(videoRef.current.currentTime / duration);
              if (videoRef.current.buffered.length > 0) {
                setBuffered(videoRef.current.buffered.end(0) / duration);
              }
            }
          }}
          onLoadedMetadata={() => setDuration(videoRef.current?.duration ?? 0)}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onWaiting={() => setBuffering(true)}
          onCanPlay={() => setBuffering(false)}
        />
      ) : (
        <iframe src={url} className="absolute inset-0 h-full w-full border-0" allowFullScreen />
      )}

      {/* 2. CENTER BUFFERING RING */}
      <AnimatePresence>
        {buffering && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center"
          >
            <div className="relative">
              <div className="h-16 w-16 rounded-full border-4 border-red-500/20" />
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 h-16 w-16 rounded-full border-4 border-t-red-600 border-r-transparent border-b-transparent border-l-transparent"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. CENTER BIG PLAY BUTTON */}
      {!playing && !buffering && (ytId || isHtml5) && (
        <div className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center">
          <button
            onClick={togglePlayPause}
            className="pointer-events-auto h-14 w-14 flex items-center justify-center rounded-full bg-red-600/90 text-white shadow-2xl transition-transform hover:scale-110 active:scale-95 ring-4 ring-red-600/10 backdrop-blur-sm"
          >
            <Play className="h-7 w-7 fill-current ml-0.5" />
          </button>
        </div>
      )}

      {/* 4. CUSTOM CONTROLS OVERLAY */}
      <div
        className={cn(
          "absolute inset-x-0 bottom-0 z-50 transition-all duration-300 px-4 pb-4 md:pb-6",
          showControls ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
        )}
        style={{ background: "linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.4) 70%, transparent 100%)", height: "auto", minHeight: "120px" }}
      >
        <div className="absolute inset-x-0 bottom-0 p-3 md:p-4 flex flex-col gap-2 md:gap-3">
          {/* Row 1: Controls (Buttons) */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 md:gap-4">
              <button
                onClick={togglePlayPause}
                className="h-8 w-8 md:h-10 md:w-10 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-all"
              >
                {playing ? <Pause className="h-4 w-4 md:h-4.5 md:w-4.5 fill-current" /> : <Play className="h-4 w-4 md:h-4.5 md:w-4.5 fill-current ml-0.5" />}
              </button>
              <div className="text-[10px] md:text-[12px] font-mono text-white/90 font-medium bg-black/40 px-2 md:px-2.5 py-0.5 md:py-1 rounded-full border border-white/5">
                {formatTime(played * duration)} <span className="text-white/30 mx-0.5">/</span> {formatTime(duration)}
              </div>
            </div>

            <div className="flex items-center gap-1.5 md:gap-2">
              <div className="group/vol hidden sm:flex items-center gap-1 bg-white/5 rounded-full px-1.5 py-0.5 transition-all hover:bg-white/10">
                <button onClick={handleMuteToggle} className="p-1.5 text-white/70 hover:text-white">
                  {muted || volume === 0 ? <VolumeX className="h-3.5 w-3.5 md:h-4 md:w-4" /> : <Volume2 className="h-3.5 w-3.5 md:h-4 md:w-4" />}
                </button>
                <div className="w-0 overflow-hidden transition-all group-hover/vol:w-16 mr-1">
                  <input
                    type="range" min={0} max={1} step="any" value={muted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="w-16 accent-red-600 cursor-pointer h-1"
                  />
                </div>
              </div>

              <button
                onClick={cyclePlaybackRate}
                className="rounded-full bg-white/5 px-2 md:px-3 py-1 md:py-1.5 text-[10px] md:text-[11px] font-bold text-white/80 hover:bg-white/10 transition-colors"
              >
                {playbackRate}x
              </button>

              <div className="relative">
                <AnimatePresence>
                  {showSettings && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      onClick={(e) => e.stopPropagation()}
                      className="absolute bottom-full right-0 mb-4 w-52 rounded-xl border border-white/10 bg-black/95 p-1.5 shadow-2xl backdrop-blur-2xl ring-1 ring-white/10"
                    >
                      {settingsView === "main" && (
                        <div className="flex flex-col gap-0.5">
                          <button onClick={() => setSettingsView("quality")} className="flex items-center justify-between rounded-lg px-3 py-2 text-xs text-white/90 hover:bg-white/10">
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="h-3.5 w-3.5 text-white/40" />
                              <span>Quality</span>
                            </div>
                            <div className="flex items-center gap-1 text-[10px] text-white/30">
                              <span>{mapYouTubeQuality(selectedQuality)}</span>
                              <ChevronRight className="h-2.5 w-2.5" />
                            </div>
                          </button>
                          <button onClick={() => setSettingsView("speed")} className="flex items-center justify-between rounded-lg px-3 py-2 text-xs text-white/90 hover:bg-white/10">
                            <div className="flex items-center gap-2">
                              <Gauge className="h-3.5 w-3.5 text-white/40" />
                              <span>Speed</span>
                            </div>
                            <div className="flex items-center gap-1 text-[10px] text-white/30">
                              <span>{playbackRate}x</span>
                              <ChevronRight className="h-2.5 w-2.5" />
                            </div>
                          </button>
                          {ytId && (
                            <button onClick={() => setSettingsView("captions")} className="flex items-center justify-between rounded-lg px-3 py-2 text-xs text-white/90 hover:bg-white/10">
                              <div className="flex items-center gap-2">
                                <Languages className="h-3.5 w-3.5 text-white/40" />
                                <span>Subtitles</span>
                              </div>
                              <div className="flex items-center gap-1 text-[10px] text-white/30">
                                <span>{currentTrackCode || "Off"}</span>
                                <ChevronRight className="h-2.5 w-2.5" />
                              </div>
                            </button>
                          )}
                        </div>
                      )}

                      {settingsView === "quality" && (
                        <div className="flex flex-col gap-0.5">
                          <button onClick={() => setSettingsView("main")} className="flex items-center gap-2 border-b border-white/5 pb-2 mb-1 px-2 py-1 text-xs font-bold text-white/60 hover:text-white">
                            <ArrowLeft className="h-3.5 w-3.5" /> Quality
                          </button>
                          <div className="max-h-40 overflow-y-auto custom-scrollbar">
                            {["auto", ...availableQualities].map(q => (
                              <button key={q} onClick={() => updateQuality(q)} className="flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-xs text-white/90 hover:bg-white/10">
                                <span>{mapYouTubeQuality(q)}</span>
                                {selectedQuality === q && <Check className="h-3 w-3 text-red-500" />}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {settingsView === "speed" && (
                        <div className="flex flex-col gap-0.5">
                          <button onClick={() => setSettingsView("main")} className="flex items-center gap-2 border-b border-white/5 pb-2 mb-1 px-2 py-1 text-xs font-bold text-white/60 hover:text-white">
                            <ArrowLeft className="h-3.5 w-3.5" /> Speed
                          </button>
                          {(availableRates.length > 0 ? availableRates : [0.5, 0.75, 1, 1.25, 1.5, 2]).map(r => (
                            <button key={r} onClick={() => updateRate(r)} className="flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-xs text-white/90 hover:bg-white/10">
                              <span>{r}x</span>
                              {playbackRate === r && <Check className="h-3 w-3 text-red-500" />}
                            </button>
                          ))}
                        </div>
                      )}

                      {settingsView === "captions" && (
                        <div className="flex flex-col gap-0.5">
                          <button onClick={() => setSettingsView("main")} className="flex items-center gap-2 border-b border-white/5 pb-2 mb-1 px-2 py-1 text-xs font-bold text-white/60 hover:text-white">
                            <ArrowLeft className="h-3.5 w-3.5" /> Subtitles
                          </button>
                          <button onClick={() => toggleCaption(null)} className="flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-xs text-white/90 hover:bg-white/10">
                            <span>Off</span>
                            {!currentTrackCode && <Check className="h-3 w-3 text-red-500" />}
                          </button>
                          {captionTracks.map(t => (
                            <button key={t.languageCode} onClick={() => toggleCaption(t)} className="flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-xs text-white/90 hover:bg-white/10">
                              <span>{t.languageName || t.languageCode}</span>
                              {currentTrackCode === t.languageCode && <Check className="h-3 w-3 text-red-500" />}
                            </button>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
                <button onClick={handleSettingsToggle} className={cn("p-1.5 md:p-2 transition-colors rounded-full hover:bg-white/5", showSettings ? "text-primary" : "text-white/70 hover:text-white")}>
                  <Settings className="h-4 md:h-4.5 w-4 md:w-4.5" />
                </button>
              </div>

              <button onClick={toggleFullscreen} className="p-1.5 md:p-2 text-white/70 hover:text-white transition-colors rounded-full hover:bg-white/5">
                {isFullscreen ? <Minimize className="h-4 md:h-4.5 w-4 md:w-4.5" /> : <Maximize className="h-4 md:h-4.5 w-4 md:w-4.5" />}
              </button>
            </div>
          </div>

          {/* Row 2: Progress Bar (Now BOTTOM) */}
          <div className="group relative flex h-1 cursor-pointer items-center rounded-full bg-white/10 transition-all hover:h-1.5">
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
    </div>
  );
}

