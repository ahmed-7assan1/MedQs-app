"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Play, Pause, Volume2, VolumeX, Maximize, Minimize,
  Settings, Check, Gauge, RotateCcw, Languages, ChevronRight, ArrowLeft, CheckCircle2,
  VideoOff, SkipBack, SkipForward, Info, Loader2
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
  const match = url.match(/drive\.google\.com\/(?:file\/d\/|open\?id=)([^/&?]+)/);
  return match ? match[1] : null;
}


function getDriveStreamUrl(id: string): string {
  return `/api/v1/drive/stream?id=${id}`;
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
  const playingRef = useRef(false);
  useEffect(() => { playingRef.current = playing; }, [playing]);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [played, setPlayed] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(true);
  const [videoReady, setVideoReady] = useState(false);
  const [buffering, setBuffering] = useState(false);
  const [buffered, setBuffered] = useState(0);
  const [playbackRestricted, setPlaybackRestricted] = useState(false);
  const [useNativeForDrive, setUseNativeForDrive] = useState(false);



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
  const isSharePoint = url.includes("sharepoint.com") || url.includes("onedrive.live.com");
  const isEmbed = isSharePoint || url.includes("/embed/");

  const driveStreamUrl = driveId ? getDriveStreamUrl(driveId) : null;
  const isHtml5 = (!ytId && !driveId && /\.(mp4|webm|ogg)$/i.test(url)) || (driveId && useNativeForDrive);


  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined" && !document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      tag.async = true;
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

  // Auto-fallback for slow Drive Premium Stream
  useEffect(() => {
    if (driveId && useNativeForDrive && !videoReady && mounted) {
      const timer = setTimeout(() => {
        if (!videoReady) {
          console.log("Drive Premium Stream slow, falling back to Ghost Player");
          setUseNativeForDrive(false);
        }
      }, 8000); // 8 seconds threshold
      return () => clearTimeout(timer);
    }
  }, [driveId, useNativeForDrive, videoReady, mounted]);

  useEffect(() => {
    if (!ytId || !mounted || !iframeLoaded) return;
    const initPlayer = () => {
      if (!iframeRef.current || !ytId) return;
      ytPlayerRef.current = new (window as any).YT.Player(iframeRef.current, {
        videoId: ytId,
        playerVars: {
          autoplay: 0,
          controls: 0,
          modestbranding: 1,
          enablejsapi: 1,
          origin: typeof window !== "undefined" ? window.location.origin : undefined,
          iv_load_policy: 3,
          disablekb: 1,
          rel: 0,
          fs: 0,
          autohide: 1,
        },
        events: {
          onReady: (event: any) => {
            setDuration(event.target.getDuration?.() ?? 0);
            event.target.setVolume(volume * 100);
            setVideoReady(true);
            const rawQualities = event.target.getAvailableQualityLevels?.() ?? [];
            setAvailableQualities(rawQualities.filter((q: string) => q !== "auto"));
            setAvailableRates(event.target.getAvailablePlaybackRates?.() ?? [0.5, 0.75, 1, 1.25, 1.5, 2]);
            if (playingRef.current) {
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
              if (ytPlayerRef.current?.unMute) ytPlayerRef.current.unMute();
              if (progressTimer.current) clearInterval(progressTimer.current);
              progressTimer.current = setInterval(() => {
                const cur = ytPlayerRef.current?.getCurrentTime ? ytPlayerRef.current.getCurrentTime() : 0;
                const dur = ytPlayerRef.current?.getDuration ? ytPlayerRef.current.getDuration() : 1;
                const loaded = ytPlayerRef.current?.getVideoLoadedFraction ? ytPlayerRef.current.getVideoLoadedFraction() : 0;
                setPlayed(cur / dur);
                setBuffered(loaded);
              }, 250);
            } else if (e.data === YT.PlayerState.BUFFERING) {
              setBuffering(true);
            } else if (e.data === YT.PlayerState.ENDED) {
              setPlaying(false);
              setVideoReady(false);
              setIframeLoaded(false);
            } else if (e.data === YT.PlayerState.PAUSED) {
              setPlaying(false);
              setBuffering(false);
            }
          },
          onError: (e: any) => {
            if (e.data === 150 || e.data === 101) setPlaybackRestricted(true);
          }
        },
      });
    };
    const checkApiAndInit = (attempts = 0) => {
      if ((window as any).YT?.Player) {
        initPlayer();
      } else if (attempts < 20) {
        setTimeout(() => checkApiAndInit(attempts + 1), 200);
      }
    };
    checkApiAndInit();
    return () => {
      if (progressTimer.current) clearInterval(progressTimer.current);
      try { ytPlayerRef.current?.destroy?.(); } catch (_) { }
      ytPlayerRef.current = null;
    };
  }, [ytId, mounted, iframeLoaded]);

  const resetHideTimer = useCallback(() => {
    setShowControls(true);
    if (hideTimeout.current) clearTimeout(hideTimeout.current);
    
    // Only set timer to hide if video is playing
    hideTimeout.current = setTimeout(() => {
      setPlaying(prevPlaying => {
        if (prevPlaying) setShowControls(false);
        return prevPlaying;
      });
    }, 3500);
  }, []);

  // Effect to handle initial hide or state changes
  useEffect(() => {
    if (playing) {
      resetHideTimer();
    } else {
      setShowControls(true);
      if (hideTimeout.current) clearTimeout(hideTimeout.current);
    }
  }, [playing, resetHideTimer]);


  const seekRelative = (seconds: number) => {
    if (ytId && ytPlayerRef.current?.getCurrentTime) {
      const cur = ytPlayerRef.current.getCurrentTime();
      const dur = ytPlayerRef.current.getDuration() || 0;
      const next = Math.max(0, Math.min(dur, cur + seconds));
      ytPlayerRef.current.seekTo(next, true);
      setPlayed(next / (dur || 1));
    } else if (videoRef.current) {
      const cur = videoRef.current.currentTime;
      const dur = videoRef.current.duration || 0;
      const next = Math.max(0, Math.min(dur, cur + seconds));
      videoRef.current.currentTime = next;
      setPlayed(next / (dur || 1));
    }
    resetHideTimer();
  };

  const handleContainerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (showControls) {
      // Only allow hiding if the video is playing
      if (playing) {
        setShowControls(false);
        if (hideTimeout.current) clearTimeout(hideTimeout.current);
      }
    } else {
      setShowControls(true);
      resetHideTimer();
    }
  };

  const togglePlayPause = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (ytId) {
      if (!videoReady) {
        setPlaying(true);
        resetHideTimer();
        return;
      }
      if (playing) {
        if (ytPlayerRef.current?.pauseVideo) ytPlayerRef.current.pauseVideo();
        setPlaying(false);
      } else {
        if (ytPlayerRef.current?.playVideo) ytPlayerRef.current.playVideo();
        setPlaying(true);
        resetHideTimer();
      }
    } else if (driveId && !useNativeForDrive) {
      // Send command to Drive Iframe (which uses YT player internally)
      const iframe = wrapperRef.current?.querySelector('iframe');
      if (iframe?.contentWindow) {
        const cmd = playing ? 'pauseVideo' : 'playVideo';
        iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: cmd, args: [] }), '*');
        setPlaying(!playing);
        resetHideTimer();
      }
    } else if (videoRef.current) {
      if (playing) {
        videoRef.current.pause();
        setPlaying(false);
      } else {
        videoRef.current.play();
        setPlaying(true);
        resetHideTimer();
      }
    }
  }, [ytId, driveId, useNativeForDrive, videoReady, playing, resetHideTimer]);

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setPlayed(val);
    if (ytId && ytPlayerRef.current) {
      const dur = ytPlayerRef.current?.getDuration ? ytPlayerRef.current.getDuration() : 0;
      if (ytPlayerRef.current?.seekTo) ytPlayerRef.current.seekTo(val * dur, true);
    } else if (videoRef.current && duration > 0) {
      videoRef.current.currentTime = val * duration;
    }
  };

  const handleMuteToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = !muted;
    setMuted(next);
    if (ytId && ytPlayerRef.current) {
      if (next) {
        if (ytPlayerRef.current?.mute) ytPlayerRef.current.mute();
      } else {
        if (ytPlayerRef.current?.unMute) ytPlayerRef.current.unMute();
      }
    }
  };

  const toggleFullscreen = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!wrapperRef.current) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else wrapperRef.current.requestFullscreen();
  };

  const [hoverPosition, setHoverPosition] = useState<number | null>(null);

  if (!mounted) return <div className="aspect-video w-full animate-pulse bg-neutral-900 rounded-[14px]" />;

  return (
    <div
      ref={wrapperRef}
      className="group relative flex h-full w-full flex-col overflow-hidden bg-black rounded-[20px] shadow-2xl border border-white/[0.02]"
      style={{ aspectRatio: "16/9" }}
      onContextMenu={(e) => e.preventDefault()}
      onMouseMove={resetHideTimer}
      onMouseLeave={() => {
        if (playing) setShowControls(false);
        setShowSettings(false);
        setHoverPosition(null);
      }}
    >
      {/* SECURITY MASKS (Hides YouTube Branding & Controls completely) */}
      {(ytId) && (
        <>
          {/* Top title mask - Gradient to hide any top-left/top-right text/icons */}
          <div className="absolute inset-x-0 top-0 z-[35] h-20 bg-gradient-to-b from-black via-black/80 to-transparent pointer-events-auto cursor-default" /> 
          {/* Bottom left logo mask */}
          <div className="absolute bottom-0 left-0 z-[35] h-16 w-48 bg-gradient-to-t from-black via-black/80 to-transparent pointer-events-auto cursor-default" /> 
          {/* Bottom right mask (where YT logo often appears) */}
          <div className="absolute bottom-0 right-0 z-[35] h-20 w-48 bg-gradient-to-t from-black via-black/90 to-transparent pointer-events-auto cursor-default flex items-end justify-end p-4">
             {/* Dynamic branding to replace YT logo */}
             {!showControls && (
                <div className="flex items-center gap-2 rounded-full bg-black/60 backdrop-blur-md px-3 py-1.5 border border-white/10 shadow-xl opacity-80">
                  <div className="h-4 w-4 rounded-full bg-primary flex items-center justify-center">
                    <Play className="h-2.5 w-2.5 fill-white text-white ml-0.5" />
                  </div>
                  <span className="text-[9px] font-bold tracking-widest text-white uppercase">MedOneX</span>
                </div>
             )}
          </div>
        </>
      )}

      <div 
        className={cn("absolute inset-0 z-0 bg-black", (ytId || isHtml5) && "cursor-pointer")}
        onClick={(ytId || isHtml5) ? handleContainerClick : undefined}
      >

        {!videoReady && ytId && (
          <div className="absolute inset-0 z-10 bg-black">
            <img 
              src={`https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`} 
              className="h-full w-full object-cover opacity-60 blur-[1px]" 
              alt=""
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
              <button 
                onClick={togglePlayPause}
                className="group/play relative flex h-20 w-20 items-center justify-center rounded-full bg-red-600 text-white shadow-[0_0_50px_rgba(220,38,38,0.4)] transition-all hover:scale-110 hover:bg-red-500"
              >
                {playing ? (
                  <Loader2 className="h-10 w-10 animate-spin" />
                ) : (
                  <Play className="ml-1.5 h-10 w-10 fill-current" />
                )}
              </button>
              {!playing && <p className="text-white/60 text-xs font-bold uppercase tracking-widest">Click to start lecture</p>}
            </div>
          </div>
        )}

        {!videoReady && driveId && (
          <div className="absolute inset-0 z-10 bg-[#07080f] flex flex-col items-center justify-center gap-6">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-red-600/20 blur-2xl animate-pulse" />
              <button 
                onClick={togglePlayPause}
                className="group/play relative flex h-24 w-24 items-center justify-center rounded-full bg-red-600 text-white shadow-2xl transition-all hover:scale-110 hover:bg-red-500"
              >
                <Play className="ml-1.5 h-10 w-10 fill-current" />
              </button>
            </div>
            <div className="flex flex-col items-center gap-2">
              <p className="text-white text-lg font-bold tracking-tight">Ready to start your session?</p>
              <p className="text-white/40 text-sm uppercase tracking-[0.2em] font-medium">Click to launch MedOneX Studio</p>
            </div>
          </div>
        )}
        {ytId && (
          <div
            ref={iframeRef}
            className="h-full w-full"
            style={{ 
              visibility: iframeLoaded ? "visible" : "hidden"
            }}
          />
        )}
        {driveId && !useNativeForDrive && (
          <div className="absolute inset-0 z-[1] bg-black">
            <iframe
              src={`https://drive.google.com/file/d/${driveId}/preview`}
              className="h-full w-full border-0"
              allow="autoplay"
              allowFullScreen
              onLoad={() => setVideoReady(true)}
            />
            {/* Pop-out blocker mask */}
            <div className="absolute top-0 right-0 z-20 h-16 w-16 bg-black pointer-events-auto cursor-default" />
          </div>
        )}


        {isSharePoint && (
           <iframe
             src={url.includes("action=embedview") ? url : `${url}${url.includes("?") ? "&" : "?"}action=embedview`}
             className="absolute inset-0 h-full w-full border-0"
             allowFullScreen
             onLoad={() => setVideoReady(true)}
           />
        )}

        {isHtml5 && (
          <video
            ref={videoRef}
            src={driveId ? driveStreamUrl! : url}
            className="absolute inset-0 h-full w-full object-contain"
            playsInline
            onTimeUpdate={(e) => {
              const v = e.currentTarget;
              setPlayed(v.currentTime / (v.duration || 1));
              const b = v.buffered;
              if (b.length > 0) setBuffered(b.end(b.length - 1) / v.duration);
            }}
            onLoadedMetadata={(e) => {
              setDuration(e.currentTarget.duration);
              setVideoReady(true);
            }}
            onWaiting={() => setBuffering(true)}
            onPlaying={() => {
              setBuffering(false);
              setPlaying(true);
            }}
            onPause={() => setPlaying(false)}
            onEnded={() => setPlaying(false)}
            onRateChange={(e) => setPlaybackRate(e.currentTarget.playbackRate)}
            onError={(e) => {
              console.error("Video error:", e);
            }}
          />
        )}

        {/* Persistent Brand Overlay (Watermark) - Now Smart/Dynamic */}
        <motion.div 
          initial={false}
          animate={{ 
            bottom: showControls ? 100 : 24,
            opacity: 1
          }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="absolute right-6 z-[60] pointer-events-none"
        >
          <div className="flex items-center gap-2 rounded-full bg-black/40 backdrop-blur-md px-3 py-1.5 border border-white/10 shadow-xl">
            <div className="h-5 w-5 rounded-full bg-red-600 flex items-center justify-center">
              <Play className="h-3 w-3 fill-white text-white ml-0.5" />
            </div>
            <span className="text-[10px] font-bold tracking-widest text-white uppercase">MedOneX Studio</span>
          </div>
        </motion.div>

        <AnimatePresence>
          {showControls && !driveId && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-[40] flex items-center justify-center gap-6 md:gap-12 bg-black/20 backdrop-blur-[1px]"
              onClick={handleContainerClick}
            >

              <button 
                onClick={(e) => { e.stopPropagation(); seekRelative(-10); }}
                className="group/seek flex flex-col items-center gap-2 text-white/80 transition-all hover:scale-110 hover:text-white"
              >
                <div className="flex h-12 w-12 md:h-16 md:w-16 items-center justify-center rounded-full bg-black/40 border border-white/10">
                  <SkipBack className="h-8 w-8 fill-current" />
                </div>
                <span className="text-xs font-bold">10s</span>
              </button>

              <button 
                onClick={togglePlayPause}
                className="group/play flex h-24 w-24 items-center justify-center rounded-full bg-red-600 text-white shadow-[0_0_50px_rgba(220,38,38,0.4)] transition-all hover:scale-110 hover:bg-red-500"
              >
                {playing ? (
                  <Pause className="h-10 w-10 md:h-12 md:w-12 fill-current" />
                ) : (
                  <Play className="ml-2 h-10 w-10 md:h-12 md:w-12 fill-current" />
                )}
              </button>

              <button 
                onClick={(e) => { e.stopPropagation(); seekRelative(10); }}
                className="group/seek flex flex-col items-center gap-2 text-white/80 transition-all hover:scale-110 hover:text-white"
              >
                <div className="flex h-12 w-12 md:h-16 md:w-16 items-center justify-center rounded-full bg-black/40 border border-white/10">
                  <SkipForward className="h-8 w-8 fill-current" />
                </div>
                <span className="text-xs font-bold">10s</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* BUFFERING & RESTRICTED OVERLAYS */}
      {buffering && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-[2px] pointer-events-none">
          <div className="h-12 w-12 rounded-full border-4 border-white/10 border-t-red-600 animate-spin" />
        </div>
      )}
      
      {playbackRestricted && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-[#0A0A0B] p-8 text-center">
          <VideoOff className="mb-4 h-16 w-16 text-white/20" />
          <h3 className="mb-2 text-xl font-bold text-white">Embedded Playback Disabled</h3>
          <p className="mb-6 text-sm text-white/40 max-w-sm">
            Please contact the administrator to resolve this issue.
          </p>
        </div>

      )}

      {/* CLICK RECEIVER (Captures screen clicks for UI toggle) */}
      {(ytId || isHtml5) && (
        <div 
          className="absolute inset-0 z-30 cursor-pointer" 
          onClick={handleContainerClick} 
          onDoubleClick={toggleFullscreen} 
        />
      )}

      {/* PREMIUM CONTROLS OVERLAY */}
      <AnimatePresence>
        {showControls && (ytId || isHtml5) && !driveId && (



          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute inset-x-0 bottom-0 z-50 flex flex-col gap-4 px-6 pb-6 pt-32"
            style={{ 
              background: "linear-gradient(to top, #07080f 0%, rgba(7, 8, 15, 0.9) 40%, rgba(7, 8, 15, 0.4) 70%, transparent 100%)",
              pointerEvents: "auto" 
            }}
            onClick={(e) => e.stopPropagation()}
          >


            {/* Top Row: Title or Header (Optional) */}
              <div className="absolute top-6 left-6 flex items-center gap-4 text-white drop-shadow-lg">
                <Info className="h-5 w-5 text-[#818cf8]" />
                <span className="font-bold tracking-tight text-[16px]">{title}</span>
              </div>


            {/* Bottom Controls Container */}
            <div className="flex flex-col gap-4">
              
              {/* Row 1: Seeker Bar */}
              <div className="group relative flex h-1.5 w-full cursor-pointer items-center rounded-full bg-white/10 transition-all hover:h-2.5">
                <div 
                  className="absolute left-0 top-0 h-full rounded-full bg-white/10 pointer-events-none" 
                  style={{ width: `${buffered * 100}%` }} 
                />
                <div 
                  className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-[#4f46e5] to-[#818cf8] shadow-[0_0_20px_rgba(79,70,229,0.5)] transition-all pointer-events-none" 
                  style={{ width: `${played * 100}%` }} 
                >
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 h-4 w-4 scale-0 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)] transition-transform group-hover:scale-100" />
                </div>

                <input
                  type="range" min={0} max={1} step="any" value={played}
                  onChange={handleSeek}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>

              {/* Row 2: Icons and Meta */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 md:gap-6">
                  <div className="flex items-center gap-2">
                    <button onClick={(e) => { e.stopPropagation(); seekRelative(-10); }} className="text-white/70 hover:text-[#818cf8] transition-colors">
                      <SkipBack className="h-5 w-5" />
                    </button>

                    <button onClick={togglePlayPause} className="text-white hover:text-red-500 transition-colors">
                      {playing ? <Pause className="h-6 w-6 fill-current" /> : <Play className="h-6 w-6 fill-current" />}
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); seekRelative(10); }} className="text-white/70 hover:text-red-500 transition-colors">
                      <SkipForward className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Volume */}
                  <div className="group/vol flex items-center gap-2">
                    <button onClick={handleMuteToggle} className="text-white hover:text-red-500 transition-colors">
                      {muted || volume === 0 ? <VolumeX className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
                    </button>
                    <div className="w-0 overflow-hidden transition-all duration-300 group-hover/vol:w-20 md:group-hover/vol:w-24">
                      <input 
                        type="range" min={0} max={1} step="0.01" value={volume}
                        onChange={(e) => {
                          const v = parseFloat(e.target.value);
                          setVolume(v);
                          if (ytPlayerRef.current?.setVolume) ytPlayerRef.current.setVolume(v * 100);
                        }}
                        className="h-1 w-full accent-red-600"
                      />
                    </div>
                  </div>

                  {/* Time Display */}
                  <div className="text-[13px] font-bold text-white/90 tabular-nums">
                    <span>{formatTime(played * duration)}</span>
                    <span className="mx-1.5 opacity-30">/</span>
                    <span className="opacity-50">{formatTime(duration)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 md:gap-5">
                  {/* Speed Picker (Shortcut) */}
                  <button 
                    onClick={() => {
                      const rates = [0.5, 0.75, 1, 1.25, 1.5, 2];
                      const idx = (rates.indexOf(playbackRate) + 1) % rates.length;
                      const next = rates[idx];
                      setPlaybackRate(next);
                      if (ytPlayerRef.current?.setPlaybackRate) ytPlayerRef.current.setPlaybackRate(next);
                    }}
                    className="flex h-8 min-w-[50px] items-center justify-center rounded-lg bg-white/5 px-2.5 text-[11px] font-black tracking-widest text-white transition-all hover:bg-white/10 hover:text-red-500"
                  >
                    {playbackRate}x
                  </button>

                  {/* Settings */}
                  <button 
                    onClick={(e) => { e.stopPropagation(); setShowSettings(!showSettings); }}
                    className={cn("text-white transition-all hover:text-red-500", showSettings && "rotate-90 text-red-500")}
                  >
                    <Settings className="h-6 w-6" />
                  </button>

                  {/* Fullscreen */}
                  <button onClick={toggleFullscreen} className="text-white hover:text-red-500 transition-colors">
                    {isFullscreen ? <Minimize className="h-6 w-6" /> : <Maximize className="h-6 w-6" />}
                  </button>

                  {/* Drive Fallback Toggle */}
                  {driveId && (
                    <button 
                      onClick={() => setUseNativeForDrive(!useNativeForDrive)}
                      className="ml-2 flex items-center gap-1.5 rounded-md bg-white/10 px-2 py-1 text-[10px] font-bold text-white hover:bg-white/20 transition-all"
                      title="Switch to original Drive player if video doesn't load"
                    >
                      {useNativeForDrive ? "Original Player" : "Premium UI"}
                    </button>
                  )}
                </div>

              </div>
            </div>

            {/* Settings Menu Popup */}
            <AnimatePresence>
              {showSettings && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 10 }}
                  className="absolute bottom-28 right-5 w-64 rounded-2xl border border-white/[0.05] bg-neutral-900/90 p-2 shadow-2xl backdrop-blur-xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  {settingsView === "main" ? (
                    <div className="flex flex-col gap-1">
                      <button onClick={() => setSettingsView("quality")} className="flex items-center justify-between rounded-xl px-4 py-3 hover:bg-white/5">
                        <div className="flex items-center gap-3"><Gauge className="h-4 w-4" /><span className="text-sm font-bold">Quality</span></div>
                        <div className="flex items-center gap-1 text-xs text-white/40">{mapYouTubeQuality(selectedQuality)} <ChevronRight className="h-3 w-3" /></div>
                      </button>
                      <button onClick={() => setSettingsView("speed")} className="flex items-center justify-between rounded-xl px-4 py-3 hover:bg-white/5">
                        <div className="flex items-center gap-3"><Gauge className="h-4 w-4" /><span className="text-sm font-bold">Speed</span></div>
                        <div className="flex items-center gap-1 text-xs text-white/40">{playbackRate}x <ChevronRight className="h-3 w-3" /></div>
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col">
                      <button onClick={() => setSettingsView("main")} className="flex items-center gap-3 border-b border-white/[0.05] px-4 py-3 hover:bg-white/5">
                        <ArrowLeft className="h-4 w-4" /><span className="text-sm font-bold">Back</span>
                      </button>
                      <div className="max-h-60 overflow-y-auto py-2">
                        {settingsView === "quality" && availableQualities.map(q => (
                          <button key={q} onClick={() => { 
                            setSelectedQuality(q); 
                            if (ytPlayerRef.current?.setPlaybackQualityRange) {
                              ytPlayerRef.current.setPlaybackQualityRange(q, q);
                            } else if (ytPlayerRef.current?.setPlaybackQuality) {
                              ytPlayerRef.current.setPlaybackQuality(q);
                            }
                            setSettingsView("main"); 
                          }} className="flex w-full items-center justify-between px-4 py-2.5 text-sm hover:bg-white/5">
                            <span>{mapYouTubeQuality(q)}</span>
                            {selectedQuality === q && <Check className="h-4 w-4 text-red-500" />}
                          </button>
                        ))}
                        {settingsView === "speed" && availableRates.map(r => (
                          <button key={r} onClick={() => { setPlaybackRate(r); if (ytPlayerRef.current?.setPlaybackRate) ytPlayerRef.current.setPlaybackRate(r); setSettingsView("main"); }} className="flex w-full items-center justify-between px-4 py-2.5 text-sm hover:bg-white/5">
                            <span>{r}x</span>
                            {playbackRate === r && <Check className="h-4 w-4 text-red-500" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
