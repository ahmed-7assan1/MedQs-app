"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Play, Pause, Volume2, VolumeX, Maximize, Minimize,
  Settings, Check, Gauge, RotateCcw, Languages, ChevronRight, ArrowLeft, CheckCircle2,
  VideoOff, SkipBack, SkipForward, Info, Loader2, Monitor
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface CustomVideoPlayerProps {
  url: string;
  title?: string;
  poster?: string;
  className?: string;
  playing?: boolean;
  minimal?: boolean;
  muted?: boolean;
  startTime?: number;
  endTime?: number;
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
    auto: "Auto",
    auto_tg: "HD (Telegram)"
  };
  return map[q] || q;
}

export function CustomVideoPlayer({
  url,
  title,
  poster,
  className,
  playing: externalPlaying,
  minimal = false,
  muted: externalMuted,
  startTime,
  endTime
}: CustomVideoPlayerProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const ambientVideoRef = useRef<HTMLVideoElement>(null);
  const seekBarRef = useRef<HTMLDivElement>(null);
  const hideTimeout = useRef<ReturnType<typeof setTimeout>>();
  const lastSaveTimeRef = useRef<number>(0);

  // Core playback states
  const [playing, setPlaying] = useState(externalPlaying || false);
  const [muted, setMuted] = useState(externalMuted || false);
  const [volume, setVolume] = useState(0.8);
  const [brightness, setBrightness] = useState(1.0);
  const [played, setPlayed] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(true);
  const [videoReady, setVideoReady] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [buffering, setBuffering] = useState(false);
  const [buffered, setBuffered] = useState(0);
  const [playbackRestricted, setPlaybackRestricted] = useState(false);
  const [useNativeForDrive, setUseNativeForDrive] = useState(false);

  // Seeker bar interactive states
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverX, setHoverX] = useState(0);
  const [isDraggingVolume, setIsDraggingVolume] = useState(false);

  // Right controls toggles
  const [bilingual, setBilingual] = useState(false);
  const [autoplay, setAutoplay] = useState(false);
  const [ccEnabled, setCcEnabled] = useState(false);
  const [isTheaterMode, setIsTheaterMode] = useState(false);

  // Settings menu states
  const [showSettings, setShowSettings] = useState(false);
  const [settingsView, setSettingsView] = useState<"main" | "quality" | "speed">("main");
  const [availableQualities, setAvailableQualities] = useState<string[]>([]);
  const [availableRates, setAvailableRates] = useState<number[]>([]);
  const [selectedQuality, setSelectedQuality] = useState<string>("auto");

  // Double click / tap tap seeking states
  const [doubleClickIndicator, setDoubleClickIndicator] = useState<"left" | "right" | null>(null);
  const doubleClickTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const lastTapTimeRef = useRef<number>(0);
  const clickTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  // Transient Overlay Action states (e.g. shortcut volume visual or play icon flash)
  const [overlayAction, setOverlayAction] = useState<{
    type: string;
    visible: boolean;
    value?: string;
  } | null>(null);
  const overlayTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const gestureIndicatorTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const touchGestureRef = useRef<{
    startX: number;
    startY: number;
    type: "brightness" | "volume" | null;
    initialValue: number;
  }>({ startX: 0, startY: 0, type: null, initialValue: 0 });

  const ytPlayerRef = useRef<any>(null);
  const progressTimer = useRef<ReturnType<typeof setInterval>>();

  // Latest refs to prevent stale closure bugs in keyboard handlers
  const playingRef = useRef(playing);
  useEffect(() => { playingRef.current = playing; }, [playing]);

  const volumeRef = useRef(volume);
  useEffect(() => { volumeRef.current = volume; }, [volume]);

  const brightnessRef = useRef(brightness);
  useEffect(() => { brightnessRef.current = brightness; }, [brightness]);

  const mutedRef = useRef(muted);
  useEffect(() => { mutedRef.current = muted; }, [muted]);

  const durationRef = useRef(duration);
  useEffect(() => { durationRef.current = duration; }, [duration]);

  const playbackRateRef = useRef(playbackRate);
  useEffect(() => { playbackRateRef.current = playbackRate; }, [playbackRate]);

  const isFullscreenRef = useRef(isFullscreen);
  useEffect(() => { isFullscreenRef.current = isFullscreen; }, [isFullscreen]);

  const isTheaterModeRef = useRef(isTheaterMode);
  useEffect(() => { isTheaterModeRef.current = isTheaterMode; }, [isTheaterMode]);

  const ccEnabledRef = useRef(ccEnabled);
  useEffect(() => { ccEnabledRef.current = ccEnabled; }, [ccEnabled]);

  const autoplayRef = useRef(autoplay);
  useEffect(() => { autoplayRef.current = autoplay; }, [autoplay]);

  const bilingualRef = useRef(bilingual);
  useEffect(() => { bilingualRef.current = bilingual; }, [bilingual]);

  // Sync external playing/muted state changes
  useEffect(() => {
    if (externalPlaying !== undefined) {
      setPlaying(externalPlaying);
      if (externalPlaying) setHasStarted(true);
    }
  }, [externalPlaying]);

  useEffect(() => {
    if (externalMuted !== undefined) {
      setMuted(externalMuted);
    }
  }, [externalMuted]);

  // Reset video player states on URL change
  useEffect(() => {
    setHasStarted(false);
    setVideoReady(false);
    setPlaying(false);
    setBuffering(false);
    setPlayed(0);
    setBuffered(0);
    setPlaybackRestricted(false);
  }, [url]);

  // Helper to resolve raw Telegram links to our proxy
  const resolvedUrl = React.useMemo(() => {
    if (!url) return url;
    if (url.includes('t.me/')) {
      return `/api/v1/telegram/stream-public-post?url=${encodeURIComponent(url)}`;
    }
    return url;
  }, [url]);

  const ytId = extractYouTubeId(resolvedUrl);
  const driveId = extractGoogleDriveId(resolvedUrl);
  const isSharePoint = resolvedUrl.includes("sharepoint.com") || resolvedUrl.includes("onedrive.live.com");

  const driveStreamUrl = driveId ? getDriveStreamUrl(driveId) : null;
  const isTelegram = resolvedUrl?.includes("/api/v1/telegram/") || resolvedUrl?.includes("/api/v1/files/telegram/");
  const isHtml5 = (!ytId && !driveId && (/\.(mp4|webm|ogg)$/i.test(resolvedUrl || "") || isTelegram)) || (driveId && useNativeForDrive);

  // Trigger transient center action overlays
  const triggerOverlayAction = (type: string, value?: string) => {
    if (overlayTimeoutRef.current) clearTimeout(overlayTimeoutRef.current);
    setOverlayAction({ type, visible: true, value });
    overlayTimeoutRef.current = setTimeout(() => {
      setOverlayAction(prev => prev ? { ...prev, visible: false } : null);
    }, 600);
  };

  // Position saving & restoring
  const saveProgress = useCallback((currentTime: number) => {
    if (!url || duration <= 0) return;
    const now = Date.now();
    // Save progress every 5 seconds if between 3s and 5s from the end
    if (currentTime > 3 && currentTime < duration - 5 && now - lastSaveTimeRef.current > 5000) {
      const key = `medqs-vid-pos-${btoa(url).substring(0, 32)}`;
      localStorage.setItem(key, currentTime.toString());
      lastSaveTimeRef.current = now;
    }
  }, [url, duration]);

  const restorePosition = useCallback((targetPlayer: any, isYouTubePlayer: boolean) => {
    if (!url) return;
    const key = `medqs-vid-pos-${btoa(url).substring(0, 32)}`;
    const savedTimeStr = localStorage.getItem(key);
    if (savedTimeStr) {
      const savedTime = parseFloat(savedTimeStr);
      if (savedTime > 0) {
        if (isYouTubePlayer) {
          targetPlayer?.seekTo?.(savedTime, true);
        } else {
          if (targetPlayer) targetPlayer.currentTime = savedTime;
        }
      }
    }
  }, [url]);

  // For HTML5/Telegram videos, set default playback rates & qualities since they don't come from YT
  useEffect(() => {
    if (isHtml5) {
      if (availableRates.length === 0) setAvailableRates([0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]);
      if (availableQualities.length === 0) {
        setAvailableQualities(["auto_tg"]);
        setSelectedQuality("auto_tg");
      }
    }
  }, [isHtml5, availableRates.length, availableQualities.length]);

  // Sync volume, rate, muted to HTML5 video reference
  useEffect(() => {
    if (videoRef.current && isHtml5) {
      videoRef.current.volume = volume;
      videoRef.current.muted = muted;
      videoRef.current.playbackRate = playbackRate;
    }
  }, [videoReady, isHtml5, volume, muted, playbackRate]);

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
      if (doubleClickTimeoutRef.current) clearTimeout(doubleClickTimeoutRef.current);
      if (overlayTimeoutRef.current) clearTimeout(overlayTimeoutRef.current);
      if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);
      document.body.classList.remove("video-theater-mode");
    };
  }, []);

  // YouTube API initialization
  useEffect(() => {
    if (!ytId || !mounted || !iframeLoaded) return;
    const initPlayer = () => {
      if (!iframeRef.current || !ytId) return;
      ytPlayerRef.current = new (window as any).YT.Player(iframeRef.current, {
        videoId: ytId,
        playerVars: {
          autoplay: playingRef.current ? 1 : 0,
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
            const dur = event.target.getDuration?.() ?? 0;
            setDuration(dur);
            event.target.setVolume(volumeRef.current * 100);
            if (mutedRef.current) event.target.mute();
            else event.target.unMute();
            setVideoReady(true);
            const rawQualities = event.target.getAvailableQualityLevels?.() ?? [];
            setAvailableQualities(rawQualities.filter((q: string) => q !== "auto"));
            setAvailableRates(event.target.getAvailablePlaybackRates?.() ?? [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]);
            
            // Restore previous progress
            restorePosition(event.target, true);

            if (playingRef.current) {
              event.target.playVideo();
            }
          },
          onStateChange: (e: any) => {
            const YT = (window as any).YT;
            if (e.data === YT.PlayerState.PLAYING) {
              setHasStarted(true);
              setPlaying(true);
              setVideoReady(true);
              setBuffering(false);
              if (progressTimer.current) clearInterval(progressTimer.current);
              progressTimer.current = setInterval(() => {
                const cur = ytPlayerRef.current?.getCurrentTime ? ytPlayerRef.current.getCurrentTime() : 0;
                const dur = ytPlayerRef.current?.getDuration ? ytPlayerRef.current.getDuration() : 1;
                const loaded = ytPlayerRef.current?.getVideoLoadedFraction ? ytPlayerRef.current.getVideoLoadedFraction() : 0;
                setPlayed(cur / dur);
                setBuffered(loaded);
                saveProgress(cur);
              }, 250);
            } else if (e.data === YT.PlayerState.BUFFERING) {
              setBuffering(true);
            } else if (e.data === YT.PlayerState.ENDED) {
              setPlaying(false);
              setVideoReady(false);
              setHasStarted(false);
              if (autoplayRef.current) {
                // Autoplay logic if desired
              }
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
  }, [ytId, mounted, iframeLoaded, saveProgress, restorePosition]);

  const resetHideTimer = useCallback(() => {
    setShowControls(true);
    if (hideTimeout.current) clearTimeout(hideTimeout.current);
    
    hideTimeout.current = setTimeout(() => {
      if (playingRef.current && !showSettings && !isScrubbing && !isDraggingVolume) {
        setShowControls(false);
      }
    }, 3500);
  }, [showSettings, isScrubbing, isDraggingVolume]);

  // Handle controls visibility sync
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
      saveProgress(next);
    } else if (videoRef.current) {
      const cur = videoRef.current.currentTime;
      const dur = videoRef.current.duration || 0;
      const next = Math.max(0, Math.min(dur, cur + seconds));
      videoRef.current.currentTime = next;
      setPlayed(next / (dur || 1));
      saveProgress(next);
    }
    resetHideTimer();
  };

  const handleContainerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (showControls) {
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
        setHasStarted(true);
        resetHideTimer();
        return;
      }
      if (playing) {
        ytPlayerRef.current?.pauseVideo?.();
        setPlaying(false);
      } else {
        ytPlayerRef.current?.playVideo?.();
        setPlaying(true);
        setHasStarted(true);
        resetHideTimer();
      }
    } else if (videoRef.current) {
      if (playing) {
        videoRef.current.pause();
        setPlaying(false);
      } else {
        videoRef.current.play();
        setPlaying(true);
        setHasStarted(true);
        resetHideTimer();
      }
    }
  }, [ytId, videoReady, playing, resetHideTimer]);

  const toggleMute = () => {
    const nextMute = !mutedRef.current;
    setMuted(nextMute);
    if (ytPlayerRef.current) {
      if (nextMute) ytPlayerRef.current.mute?.();
      else ytPlayerRef.current.unMute?.();
    }
    if (videoRef.current) {
      videoRef.current.muted = nextMute;
    }
    triggerOverlayAction(nextMute ? "mute" : "unmute");
  };

  const toggleFullscreen = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!wrapperRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      wrapperRef.current.requestFullscreen();
    }
  };

  const togglePip = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!videoRef.current) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await videoRef.current.requestPictureInPicture();
      }
    } catch (err) {
      console.error("PiP error:", err);
    }
  };

  // Keyboard events listener
  useEffect(() => {
    const isInputFocused = () => {
      const active = document.activeElement;
      if (!active) return false;
      const tag = active.tagName.toLowerCase();
      return tag === "input" || tag === "textarea" || active.hasAttribute("contenteditable") || active.getAttribute("contenteditable") === "true";
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isInputFocused()) return;

      const keysToPrevent = ["Space", " ", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "f", "F", "m", "M", "j", "J", "l", "L", "k", "K", "t", "T", "c", "C", "<", ">"];
      if (keysToPrevent.includes(e.key) || (e.key >= "0" && e.key <= "9")) {
        if (e.key === " " || e.key === "Space" || e.key.startsWith("Arrow")) {
          e.preventDefault();
        }
      }

      // Space / k -> Play / Pause
      if (e.key === " " || e.key === "Space" || e.key === "k" || e.key === "K") {
        togglePlayPause();
        triggerOverlayAction(playingRef.current ? "pause" : "play");
      }

      // j / J -> seek back 10s
      if (e.key === "j" || e.key === "J") {
        seekRelative(-10);
        triggerOverlayAction("seek-back-10");
      }

      // l / L -> seek forward 10s
      if (e.key === "l" || e.key === "L") {
        seekRelative(10);
        triggerOverlayAction("seek-forward-10");
      }

      // Left Arrow -> seek back 5s
      if (e.key === "ArrowLeft") {
        seekRelative(-5);
        triggerOverlayAction("seek-back-5");
      }

      // Right Arrow -> seek forward 5s
      if (e.key === "ArrowRight") {
        seekRelative(5);
        triggerOverlayAction("seek-forward-5");
      }

      // Up Arrow -> volume up 5%
      if (e.key === "ArrowUp") {
        const next = Math.min(1, volumeRef.current + 0.05);
        setVolume(next);
        if (ytPlayerRef.current?.setVolume) ytPlayerRef.current.setVolume(next * 100);
        if (videoRef.current) {
          videoRef.current.volume = next;
          videoRef.current.muted = next === 0;
        }
        if (next > 0) setMuted(false);
        triggerOverlayAction(`volume-${Math.round(next * 100)}`);
      }

      // Down Arrow -> volume down 5%
      if (e.key === "ArrowDown") {
        const next = Math.max(0, volumeRef.current - 0.05);
        setVolume(next);
        if (ytPlayerRef.current?.setVolume) ytPlayerRef.current.setVolume(next * 100);
        if (videoRef.current) {
          videoRef.current.volume = next;
          videoRef.current.muted = next === 0;
        }
        if (next === 0) setMuted(true);
        triggerOverlayAction(`volume-${Math.round(next * 100)}`);
      }

      // m / M -> mute / unmute
      if (e.key === "m" || e.key === "M") {
        toggleMute();
      }

      // f / F -> toggle fullscreen
      if (e.key === "f" || e.key === "F") {
        toggleFullscreen();
      }

      // t / T -> toggle theater mode
      if (e.key === "t" || e.key === "T") {
        toggleTheaterMode();
      }

      // c / C -> toggle captions (CC)
      if (e.key === "c" || e.key === "C") {
        toggleCC();
      }

      // 0 to 9 -> seek to percentage
      if (e.key >= "0" && e.key <= "9") {
        if (durationRef.current > 0) {
          const pct = parseInt(e.key) / 10;
          const dest = pct * durationRef.current;
          setPlayed(pct);
          if (ytId && ytPlayerRef.current?.seekTo) {
            ytPlayerRef.current.seekTo(dest, true);
          } else if (videoRef.current) {
            videoRef.current.currentTime = dest;
          }
          saveProgress(dest);
          triggerOverlayAction(`seek-pct-${e.key}0`);
        }
      }

      // Speed Adjustments
      if (e.key === ">" || (e.shiftKey && e.key === ".")) {
        const rates = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
        const idx = rates.indexOf(playbackRateRef.current);
        if (idx !== -1 && idx < rates.length - 1) {
          const next = rates[idx + 1];
          setPlaybackRate(next);
          if (ytPlayerRef.current?.setPlaybackRate) ytPlayerRef.current.setPlaybackRate(next);
          if (videoRef.current) videoRef.current.playbackRate = next;
          triggerOverlayAction(`speed-${next}x`);
        }
      }
      if (e.key === "<" || (e.shiftKey && e.key === ",")) {
        const rates = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
        const idx = rates.indexOf(playbackRateRef.current);
        if (idx > 0) {
          const next = rates[idx - 1];
          setPlaybackRate(next);
          if (ytPlayerRef.current?.setPlaybackRate) ytPlayerRef.current.setPlaybackRate(next);
          if (videoRef.current) videoRef.current.playbackRate = next;
          triggerOverlayAction(`speed-${next}x`);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [ytId, saveProgress]);

  // Double tap seeking logic
  const handleVideoStageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const now = Date.now();
    const DOUBLE_CLICK_DELAY = 300;
    
    if (now - lastTapTimeRef.current < DOUBLE_CLICK_DELAY) {
      if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);
      
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const width = rect.width;
      
      if (clickX < width * 0.35) {
        seekRelative(-10);
        triggerOverlayAction("seek-back-10");
        setDoubleClickIndicator("left");
        if (doubleClickTimeoutRef.current) clearTimeout(doubleClickTimeoutRef.current);
        doubleClickTimeoutRef.current = setTimeout(() => setDoubleClickIndicator(null), 600);
      } else if (clickX > width * 0.65) {
        seekRelative(10);
        triggerOverlayAction("seek-forward-10");
        setDoubleClickIndicator("right");
        if (doubleClickTimeoutRef.current) clearTimeout(doubleClickTimeoutRef.current);
        doubleClickTimeoutRef.current = setTimeout(() => setDoubleClickIndicator(null), 600);
      } else {
        toggleFullscreen();
      }
      
      lastTapTimeRef.current = 0;
    } else {
      lastTapTimeRef.current = now;
      clickTimeoutRef.current = setTimeout(() => {
        togglePlayPause();
      }, 250);
    }
  };

  // Mobile touch gesture handlers for volume (right side) and brightness (left side)
  const [gestureIndicator, setGestureIndicator] = useState<{
    type: "brightness" | "volume";
    value: number;
    visible: boolean;
  } | null>(null);

  const showGestureIndicator = (type: "brightness" | "volume", value: number) => {
    setGestureIndicator({ type, value, visible: true });
    if (gestureIndicatorTimeoutRef.current) clearTimeout(gestureIndicatorTimeoutRef.current);
    gestureIndicatorTimeoutRef.current = setTimeout(() => {
      setGestureIndicator((prev) => prev ? { ...prev, visible: false } : null);
    }, 800);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    const rect = e.currentTarget.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const width = rect.width;
    touchGestureRef.current = {
      startX: x,
      startY: touch.clientY - rect.top,
      type: x < width * 0.5 ? "brightness" : "volume",
      initialValue: x < width * 0.5 ? brightnessRef.current : volumeRef.current,
    };
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const gesture = touchGestureRef.current;
    if (!gesture.type) return;
    const touch = e.touches[0];
    const rect = e.currentTarget.getBoundingClientRect();
    const y = touch.clientY - rect.top;
    const height = rect.height;
    const delta = (gesture.startY - y) / height;
    const newValue = Math.max(0, Math.min(1, gesture.initialValue + delta));
    if (gesture.type === "brightness") {
      setBrightness(0.3 + newValue * 1.7);
      showGestureIndicator("brightness", newValue);
    } else {
      setVolume(newValue);
      if (ytPlayerRef.current?.setVolume) ytPlayerRef.current.setVolume(newValue * 100);
      if (videoRef.current) {
        videoRef.current.volume = newValue;
        videoRef.current.muted = newValue === 0;
      }
      showGestureIndicator("volume", newValue);
    }
  };

  const handleTouchEnd = () => {
    touchGestureRef.current.type = null;
  };

  // Seek bar custom mouse scrubbing
  const handleSeekStart = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsScrubbing(true);
    resetHideTimer();

    if (!seekBarRef.current || duration <= 0) return;
    const rect = seekBarRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const percent = x / rect.width;
    setPlayed(percent);

    if (ytId && ytPlayerRef.current?.seekTo) {
      ytPlayerRef.current.seekTo(percent * duration, false);
    } else if (videoRef.current) {
      videoRef.current.currentTime = percent * duration;
    }
  };

  useEffect(() => {
    if (!isScrubbing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!seekBarRef.current || duration <= 0) return;
      const rect = seekBarRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
      const percent = x / rect.width;
      setPlayed(percent);
      
      if (ytId && ytPlayerRef.current?.seekTo) {
        ytPlayerRef.current.seekTo(percent * duration, false);
      } else if (videoRef.current) {
        videoRef.current.currentTime = percent * duration;
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      setIsScrubbing(false);
      
      if (!seekBarRef.current || duration <= 0) return;
      const rect = seekBarRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
      const percent = x / rect.width;
      setPlayed(percent);
      
      if (ytId && ytPlayerRef.current?.seekTo) {
        ytPlayerRef.current.seekTo(percent * duration, true);
      } else if (videoRef.current) {
        videoRef.current.currentTime = percent * duration;
      }
      saveProgress(percent * duration);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isScrubbing, duration, ytId, saveProgress]);

  const handleSeekBarMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!seekBarRef.current || duration <= 0) return;
    const rect = seekBarRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const percent = x / rect.width;
    setHoverX(x);
    setHoverTime(percent * duration);
  };

  const handleSeekBarMouseLeave = () => {
    setHoverTime(null);
  };

  const toggleTheaterMode = () => {
    setIsTheaterMode(prev => {
      const next = !prev;
      if (next) {
        document.body.classList.add("video-theater-mode");
      } else {
        document.body.classList.remove("video-theater-mode");
      }
      return next;
    });
  };

  const toggleCC = () => {
    setCcEnabled(prev => {
      const next = !prev;
      
      // Youtube toggle CC
      if (ytPlayerRef.current) {
        try {
          if (next) {
            ytPlayerRef.current.loadModule?.("captions");
            ytPlayerRef.current.setOption?.("captions", "track", { languageCode: "en" });
          } else {
            ytPlayerRef.current.unloadModule?.("captions");
          }
        } catch (_) {}
      }

      // HTML5 toggle CC
      if (videoRef.current) {
        const tracks = videoRef.current.textTracks;
        for (let i = 0; i < tracks.length; i++) {
          tracks[i].mode = next ? "showing" : "disabled";
        }
      }

      triggerOverlayAction(next ? "cc-on" : "cc-off");
      return next;
    });
  };

  const getVolumeIcon = () => {
    if (muted || volume === 0) {
      return (
        <svg viewBox="0 0 36 36" className="h-[28px] w-[28px] fill-current">
          <path d="m 21.4,14.5 -1.2,1.2 2.2,2.2 -2.2,2.2 1.2,1.2 2.2,-2.2 2.2,2.2 1.2,-1.2 -2.2,-2.2 2.2,-2.2 -1.2,-1.2 -2.2,2.2 z M 19,10.6 l -4.7,4.7 -3.3,0 0,5.4 3.3,0 4.7,4.7 0,-14.8 z" />
        </svg>
      );
    }
    if (volume < 0.5) {
      return (
        <svg viewBox="0 0 36 36" className="h-[28px] w-[28px] fill-current">
          <path d="M8,21 L12,21 L17,26 L17,10 L12,15 L8,15 L8,21 Z M19,14.5 C20.3,15.7 21,16.8 21,18 C21,19.2 20.3,20.3 19,21.5 L19,14.5 Z" />
        </svg>
      );
    }
    return (
      <svg viewBox="0 0 36 36" className="h-[28px] w-[28px] fill-current">
        <path d="M8,21 L12,21 L17,26 L17,10 L12,15 L8,15 L8,21 Z M 22.4,18.0 C 22.4,15.6 21.0,13.6 19.0,12.6 L 19.0,23.4 C 21.0,22.4 22.4,20.4 22.4,18.0 Z M 19.0,8.2 L 19.0,10.3 C 22.5,11.2 25.0,14.3 25.0,18.0 C 25.0,21.7 22.5,24.8 19.0,25.7 L 19.0,27.8 C 23.6,26.8 27.0,22.8 27.0,18.0 C 27.0,13.2 23.6,9.2 19.0,8.2 Z" />
      </svg>
    );
  };

  if (!mounted) return <div className="aspect-video w-full animate-pulse bg-neutral-900 rounded-[14px]" />;

  return (
    <div 
      className={cn("relative w-full transition-all duration-300", className)} 
      style={{ aspectRatio: isTheaterMode ? "21/9" : "16/9" }}
    >
      {/* AMBIENT GLOW SYSTEM */}
      {!isFullscreen && (
        <div className="absolute inset-0 -z-10 scale-[1.06] opacity-[0.45] blur-[70px] pointer-events-none select-none overflow-hidden transition-all duration-700 animate-ambient">
          {ytId && (
            <img 
              src={`https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`} 
              className="h-full w-full object-cover" 
              alt=""
              onError={(e) => {
                e.currentTarget.src = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
              }}
            />
          )}
          {isHtml5 && (
            <video
              ref={ambientVideoRef}
              src={driveId ? driveStreamUrl! : resolvedUrl}
              className="h-full w-full object-cover"
              muted
              playsInline
            />
          )}
        </div>
      )}

      {/* Main Video Player Container */}
      <div
        ref={wrapperRef}
        className={cn(
          "group relative flex h-full w-full flex-col overflow-hidden bg-black shadow-2xl transition-all duration-300",
          isTheaterMode ? "rounded-none border-none" : "rounded-[20px] border border-white/[0.08]"
        )}
        onContextMenu={(e) => e.preventDefault()}
        onMouseMove={resetHideTimer}
        onMouseLeave={() => {
          if (playing) setShowControls(false);
          setShowSettings(false);
          setHoverTime(null);
        }}
      >
      {/* Dynamic Global Styles for Theater Mode expansion & Ambient animation */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes ambientPulse {
          0%, 100% { opacity: 0.38; transform: scale(1.05) rotate(0deg); }
          50% { opacity: 0.50; transform: scale(1.08) rotate(1deg); }
        }
        .animate-ambient {
          animation: ambientPulse 12s ease-in-out infinite;
        }
        .yt-volume-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          height: 12px;
          width: 12px;
          border-radius: 50%;
          background: #fff;
          cursor: pointer;
        }
        .yt-volume-slider::-moz-range-thumb {
          height: 12px;
          width: 12px;
          border-radius: 50%;
          background: #fff;
          cursor: pointer;
          border: none;
        }
        body.video-theater-mode .max-w-7xl {
          max-width: 100% !important;
          padding-left: 0 !important;
          padding-right: 0 !important;
        }
        body.video-theater-mode .rounded-3xl, 
        body.video-theater-mode .rounded-\\[2\\.5rem\\],
        body.video-theater-mode .rounded-\\[20px\\] {
          border-radius: 0 !important;
          border-left: none !important;
          border-right: none !important;
        }
        body.video-theater-mode .group.relative.overflow-hidden {
          border-radius: 0 !important;
        }
      `}} />

      {/* SECURITY MASKS (Hides YouTube Branding & Controls completely) */}
      {ytId && (
        <AnimatePresence>
          {(showControls || buffering || !videoReady) && !minimal && (
            <motion.div 
              key="security-masks"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-[35] pointer-events-none"
            >
              {/* Top title mask - Gradient to hide any top-left/top-right text/icons */}
              <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black via-black/80 to-transparent" /> 
              {/* Bottom left logo mask */}
              <div className="absolute bottom-0 left-0 h-20 w-56 bg-gradient-to-t from-black via-black/80 to-transparent" /> 
              {/* Bottom right mask (where YT logo often appears) */}
              <div className="absolute bottom-0 right-0 h-24 w-56 bg-gradient-to-t from-black via-black/90 to-transparent flex items-end justify-end p-4">
                 <div className="flex items-center gap-2 rounded-full bg-black/60 backdrop-blur-md px-3 py-1.5 border border-white/10 shadow-xl opacity-80">
                   <div className="h-4 w-4 rounded-full bg-primary flex items-center justify-center">
                     <Play className="h-2.5 w-2.5 fill-white text-white ml-0.5" />
                   </div>
                   <span className="text-[9px] font-bold tracking-widest text-white uppercase">MedOneX</span>
                 </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* VIDEO STAGE WRAPPER */}
      <div 
        className={cn("absolute inset-0 z-0 bg-black", (ytId || isHtml5) && "cursor-pointer")}
        onClick={handleVideoStageClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Placeholder / Poster image */}
        {((ytId || isHtml5) && !hasStarted) && (
          <div className="absolute inset-0 z-10 bg-black">
            {ytId ? (
              <img 
                src={`https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`} 
                className="h-full w-full object-cover opacity-60 blur-[1px]" 
                alt=""
              />
            ) : poster ? (
              <img 
                src={poster} 
                className="h-full w-full object-cover opacity-60" 
                alt=""
              />
            ) : (
              <div className="absolute inset-0 bg-[#0A0A0B] flex items-center justify-center">
                <div className="absolute inset-0 overflow-hidden">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent animate-pulse" />
                </div>
              </div>
            )}
            
            {/* Center Loading Play Icon */}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
               {isTelegram && (
                 <div className="mb-2 flex flex-col items-center gap-2">
                    <div className="rounded-full bg-indigo-500/20 px-4 py-1.5 border border-indigo-500/30 backdrop-blur-md animate-bounce">
                       <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">Secured Telegram Stream</span>
                    </div>
                 </div>
               )}

              <button 
                onClick={togglePlayPause}
                className={cn(
                  "group/play relative flex h-20 w-20 items-center justify-center rounded-full text-white shadow-2xl transition-all hover:scale-110",
                  isTelegram ? "bg-indigo-600 shadow-indigo-500/40 hover:bg-indigo-500" : "bg-red-600 shadow-red-500/40 hover:bg-red-500"
                )}
              >
                {playing || buffering ? (
                  <Loader2 className="h-9 w-9 animate-spin" />
                ) : (
                  <Play className={cn("h-9 w-9 fill-current", isTelegram ? "" : "ml-1")} />
                )}
              </button>
              {(!playing && !buffering) && (
                <p className="text-white/60 text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">
                  Click to start lecture
                </p>
              )}
            </div>
          </div>
        )}

        {/* YouTube Frame */}
        {ytId && (
          <div
            className="absolute inset-0"
            style={{ filter: `brightness(${brightness})` }}
          >
            <div
              ref={iframeRef}
              className="h-full w-full pointer-events-none"
              style={{ 
                visibility: iframeLoaded ? "visible" : "hidden"
              }}
            />
          </div>
        )}

        {/* HTML5 Video */}
        {isHtml5 && (
          <video
            ref={videoRef}
            src={driveId ? driveStreamUrl! : resolvedUrl}
            className="absolute inset-0 h-full w-full object-contain pointer-events-none"
            style={{ filter: `brightness(${brightness})` }}
            playsInline
            onTimeUpdate={(e) => {
              const v = e.currentTarget;
              setPlayed(v.currentTime / (v.duration || 1));
              const b = v.buffered;
              if (b.length > 0) setBuffered(b.end(b.length - 1) / v.duration);
              saveProgress(v.currentTime);
              // Synchronize ambient glow video frame position
              if (ambientVideoRef.current && Math.abs(ambientVideoRef.current.currentTime - v.currentTime) > 0.3) {
                ambientVideoRef.current.currentTime = v.currentTime;
              }
            }}
            onLoadedMetadata={(e) => {
              setDuration(e.currentTarget.duration);
              setVideoReady(true);
              restorePosition(e.currentTarget, false);
              if (ambientVideoRef.current) {
                ambientVideoRef.current.playbackRate = e.currentTarget.playbackRate;
                ambientVideoRef.current.currentTime = e.currentTarget.currentTime;
              }
            }}
            onCanPlay={() => {
              setVideoReady(true);
              setBuffering(false);
            }}
            onWaiting={() => setBuffering(true)}
            onPlaying={() => {
              setHasStarted(true);
              setBuffering(false);
              setPlaying(true);
              setVideoReady(true);
              ambientVideoRef.current?.play().catch(() => {});
            }}
            onPause={() => {
              setPlaying(false);
              ambientVideoRef.current?.pause();
            }}
            onEnded={() => {
              setPlaying(false);
              setHasStarted(false);
              ambientVideoRef.current?.pause();
            }}
            onRateChange={(e) => {
              setPlaybackRate(e.currentTarget.playbackRate);
              if (ambientVideoRef.current) {
                ambientVideoRef.current.playbackRate = e.currentTarget.playbackRate;
              }
            }}
            onError={(e) => {
              console.error("Video error:", e);
            }}
          />
        )}

        {/* Watermark logo on top-right */}
        {!minimal && (
          <motion.div 
            initial={false}
            animate={{ 
              top: 24,
              opacity: showControls ? 0.9 : 0
            }}
            className="absolute right-6 z-[36] pointer-events-none transition-opacity duration-300"
          >
            <div className="flex items-center gap-2 rounded-full bg-black/40 backdrop-blur-md px-3 py-1.5 border border-white/10 shadow-xl">
              <div className="h-4 w-4 rounded-full bg-red-600 flex items-center justify-center">
                <Play className="h-2 w-2 fill-white text-white ml-0.5" />
              </div>
              <span className="text-[9px] font-bold tracking-widest text-white uppercase">MedOneX Studio</span>
            </div>
          </motion.div>
        )}

        {/* DOUBLE TAP / CLICK SEEK INDICATORS (YouTube style ripples) */}
        <AnimatePresence>
          {doubleClickIndicator === "left" && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-y-0 left-0 w-1/3 z-20 pointer-events-none flex items-center justify-center bg-gradient-to-r from-white/10 to-transparent rounded-l-[20px]"
            >
              <div className="flex flex-col items-center gap-1 text-white">
                <div className="flex gap-0.5 animate-pulse">
                  <span className="text-sm">◀◀◀</span>
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider text-white/95">10 Seconds</span>
              </div>
            </motion.div>
          )}
          {doubleClickIndicator === "right" && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-y-0 right-0 w-1/3 z-20 pointer-events-none flex items-center justify-center bg-gradient-to-l from-white/10 to-transparent rounded-r-[20px]"
            >
              <div className="flex flex-col items-center gap-1 text-white">
                <div className="flex gap-0.5 animate-pulse">
                  <span className="text-sm">▶▶▶</span>
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider text-white/95">10 Seconds</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* MOBILE TOUCH GESTURE INDICATOR (brightness / volume) */}
        <AnimatePresence>
          {gestureIndicator?.visible && (
            <motion.div
              key={gestureIndicator.type}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none flex flex-col items-center gap-2"
            >
              <div className="flex items-center gap-2 rounded-2xl bg-black/70 backdrop-blur-md px-5 py-3 border border-white/10 shadow-2xl">
                {gestureIndicator.type === "brightness" ? (
                  <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="5" />
                    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                  </svg>
                ) : (
                  <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                    <path d="M15.54 8.46a5 5 0 010 7.07" />
                    <path d="M19.07 4.93a10 10 0 010 14.14" />
                  </svg>
                )}
                <span className="text-xs font-bold text-white tabular-nums">
                  {Math.round((gestureIndicator.type === "brightness" 
                    ? (gestureIndicator.value - 0.3) / 1.7 
                    : gestureIndicator.value) * 100)}%
                </span>
              </div>
              <div className="h-1.5 w-24 overflow-hidden rounded-full bg-white/20">
                <div
                  className="h-full rounded-full bg-white transition-all"
                  style={{ width: `${Math.round((gestureIndicator.type === "brightness"
                    ? (gestureIndicator.value - 0.3) / 1.7
                    : gestureIndicator.value) * 100)}%` }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* BUFFERING & RESTRICTED OVERLAYS */}
      {buffering && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-[2px] pointer-events-none">
          <div className="h-10 w-10 rounded-full border-4 border-white/20 border-t-red-600 animate-spin" />
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

      {/* CENTRAL PAUSE BIG PLAY BUTTON */}
      <AnimatePresence>
        {!playing && videoReady && showControls && hasStarted && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none"
          >
            <button
              onClick={togglePlayPause}
              className="h-16 w-16 md:h-20 md:w-20 rounded-full bg-black/55 hover:bg-black/75 border border-white/10 text-white flex items-center justify-center shadow-2xl pointer-events-auto hover:scale-110 transition-transform duration-200"
            >
              <svg viewBox="0 0 36 36" className="h-8 w-8 md:h-10 md:w-10 fill-current ml-1 text-white">
                <path d="M 12,26 18.5,22 25,18 18.5,14 12,10 z" />
              </svg>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TRANSIENT KEYBOARD SHORTCUT OVERLAYS */}
      <AnimatePresence>
        {overlayAction?.visible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.18 }}
            className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none"
          >
            <div className="flex flex-col items-center gap-2 rounded-full bg-black/65 backdrop-blur-md px-6 py-6 border border-white/10 shadow-2xl text-white">
              {overlayAction.type === "play" && (
                <svg viewBox="0 0 36 36" className="h-8 w-8 fill-current text-white">
                  <path d="M 12,26 18.5,22 25,18 18.5,14 12,10 z" />
                </svg>
              )}
              {overlayAction.type === "pause" && (
                <svg viewBox="0 0 36 36" className="h-8 w-8 fill-current text-white">
                  <path d="M 12,26 16,26 16,10 12,10 z M 20,10 20,26 24,26 24,10 z" />
                </svg>
              )}
              {overlayAction.type === "mute" && <VolumeX className="h-8 w-8 text-white" />}
              {overlayAction.type === "unmute" && <Volume2 className="h-8 w-8 text-white" />}
              {overlayAction.type === "seek-forward-10" && (
                <div className="flex flex-col items-center gap-0.5">
                  <SkipForward className="h-8 w-8 text-white fill-current animate-pulse" />
                  <span className="text-[10px] font-black">+10s</span>
                </div>
              )}
              {overlayAction.type === "seek-back-10" && (
                <div className="flex flex-col items-center gap-0.5">
                  <SkipBack className="h-8 w-8 text-white fill-current animate-pulse" />
                  <span className="text-[10px] font-black">-10s</span>
                </div>
              )}
              {overlayAction.type === "seek-forward-5" && (
                <div className="flex flex-col items-center gap-0.5">
                  <SkipForward className="h-8 w-8 text-white fill-current animate-pulse" />
                  <span className="text-[10px] font-black">+5s</span>
                </div>
              )}
              {overlayAction.type === "seek-back-5" && (
                <div className="flex flex-col items-center gap-0.5">
                  <SkipBack className="h-8 w-8 text-white fill-current animate-pulse" />
                  <span className="text-[10px] font-black">-5s</span>
                </div>
              )}
              {overlayAction.type.startsWith("volume-") && (
                <div className="flex flex-col items-center gap-0.5">
                  <Volume2 className="h-8 w-8 text-white" />
                  <span className="text-[10px] font-black">{overlayAction.type.split("-")[1]}%</span>
                </div>
              )}
              {overlayAction.type.startsWith("speed-") && (
                <div className="flex flex-col items-center gap-0.5">
                  <Gauge className="h-8 w-8 text-white" />
                  <span className="text-[10px] font-black">{overlayAction.type.split("-")[1]}</span>
                </div>
              )}
              {overlayAction.type === "cc-on" && <span className="text-xs font-black uppercase tracking-widest text-[#f00]">CC Enabled</span>}
              {overlayAction.type === "cc-off" && <span className="text-xs font-black uppercase tracking-widest text-white/50">CC Disabled</span>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PREMIUM CONTROLS OVERLAY */}
      <AnimatePresence>
        {showControls && (ytId || isHtml5) && !driveId && (
          <motion.div
            key="bottom-controls"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute inset-x-0 bottom-0 z-50 flex flex-col gap-3 px-4 pb-4 pt-24"
            style={{ 
              background: "linear-gradient(to top, rgba(0, 0, 0, 0.95) 0%, rgba(0, 0, 0, 0.8) 35%, rgba(0, 0, 0, 0.4) 65%, transparent 100%)",
              pointerEvents: "auto" 
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Row: Title or Header */}
            {!minimal && title && (
              <div className="absolute top-4 left-4 flex items-center gap-3 text-white drop-shadow-md pointer-events-none">
                <Info className="h-4 w-4 text-white/80" />
                <span className="font-bold tracking-tight text-sm line-clamp-1">{title}</span>
              </div>
            )}

            {/* Controls Content Container */}
            <div className="flex flex-col gap-2.5">
              
              {/* Seeker Bar (YouTube Style) */}
              <div 
                ref={seekBarRef}
                className="group/seek relative flex h-[3px] w-full cursor-pointer items-center bg-white/20 transition-all hover:h-1.5"
                onMouseDown={handleSeekStart}
                onMouseMove={handleSeekBarMouseMove}
                onMouseLeave={handleSeekBarMouseLeave}
              >
                {/* Buffered Progress */}
                <div 
                  className="absolute left-0 top-0 h-full bg-white/30 pointer-events-none" 
                  style={{ width: `${buffered * 100}%` }} 
                />
                
                {/* Hover progress preview */}
                {hoverTime !== null && (
                  <div 
                    className="absolute left-0 top-0 h-full bg-white/25 pointer-events-none" 
                    style={{ width: `${(hoverX / (seekBarRef.current?.getBoundingClientRect().width || 1)) * 100}%` }} 
                  />
                )}

                {/* Played Progress */}
                <div 
                  className="absolute left-0 top-0 h-full bg-[#f00] pointer-events-none" 
                  style={{ width: `${played * 100}%` }} 
                />

                {/* Scrub handle (red circle) */}
                <div 
                  className={cn(
                    "absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-3.5 w-3.5 rounded-full bg-[#f00] transition-transform scale-0 group-hover/seek:scale-100",
                    isScrubbing && "scale-100"
                  )}
                  style={{ left: `${played * 100}%` }}
                />

                {/* Hover Time Tooltip */}
                {hoverTime !== null && (
                  <div 
                    className="absolute bottom-4 -translate-x-1/2 rounded bg-[#1c1c1e] border border-white/10 px-2 py-0.5 text-[10px] font-bold text-white pointer-events-none shadow-xl"
                    style={{ left: `${hoverX}px` }}
                  >
                    {formatTime(hoverTime)}
                  </div>
                )}
              </div>

              {/* Bottom Row Controls */}
              <div className="flex items-center justify-between">
                
                {/* Left Controls */}
                <div className="flex items-center gap-3.5 md:gap-5">
                  <div className="flex items-center gap-1">
                    {/* Play/Pause Button */}
                    <button 
                      onClick={() => togglePlayPause()} 
                      className="text-white hover:text-red-500 transition-colors flex items-center justify-center h-10 w-10"
                      title={playing ? "Pause (k)" : "Play (k)"}
                    >
                      {playing ? (
                        <svg viewBox="0 0 36 36" className="h-[28px] w-[28px] fill-current">
                          <path d="M 12,26 16,26 16,10 12,10 z M 20,10 20,26 24,26 24,10 z" />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 36 36" className="h-[28px] w-[28px] fill-current">
                          <path d="M 12,26 18.5,22 25,18 18.5,14 12,10 z" />
                        </svg>
                      )}
                    </button>

                    {/* Next Button placeholder */}
                    {!minimal && (
                      <button 
                        className="text-white/80 hover:text-white transition-colors flex items-center justify-center h-10 w-10" 
                        title="Next (Shift+N)"
                      >
                        <svg viewBox="0 0 36 36" className="h-[28px] w-[28px] fill-current">
                          <path d="M 12,24 20.5,18 12,12 z M 22,12 22,24 24,24 24,12 z" />
                        </svg>
                      </button>
                    )}
                  </div>

                  {/* Volume Slider with Hover Expand */}
                  <div className="group/vol flex items-center gap-1.5">
                    <button onClick={toggleMute} className="text-white hover:text-red-500 transition-colors">
                      {getVolumeIcon()}
                    </button>
                    <div className={cn(
                      "w-0 overflow-hidden transition-all duration-300",
                      isDraggingVolume ? "w-16 md:w-20" : "group-hover/vol:w-16 md:group-hover/vol:w-20"
                    )}>
                      <input 
                        type="range" min={0} max={1} step="0.01" value={volume}
                        onChange={(e) => {
                          const v = parseFloat(e.target.value);
                          setVolume(v);
                          if (ytPlayerRef.current?.setVolume) ytPlayerRef.current.setVolume(v * 100);
                          if (videoRef.current) {
                            videoRef.current.volume = v;
                            videoRef.current.muted = v === 0;
                          }
                          if (v === 0) setMuted(true);
                          else if (muted) setMuted(false);
                        }}
                        onMouseDown={() => setIsDraggingVolume(true)}
                        onMouseUp={() => setIsDraggingVolume(false)}
                        onTouchStart={() => setIsDraggingVolume(true)}
                        onTouchEnd={() => setIsDraggingVolume(false)}
                        className="yt-volume-slider h-1 w-full accent-white bg-white/30 rounded-full cursor-pointer appearance-none outline-none"
                        style={{
                          background: `linear-gradient(to right, #fff 0%, #fff ${volume * 100}%, rgba(255,255,255,0.3) ${volume * 100}%, rgba(255,255,255,0.3) 100%)`
                        }}
                      />
                    </div>
                  </div>

                  {/* Time Display */}
                  <div className="text-[12px] font-medium text-white/90 tabular-nums">
                    <span>{formatTime(played * duration)}</span>
                    <span className="mx-1.5 opacity-40">/</span>
                    <span className="opacity-60">{formatTime(duration)}</span>
                  </div>
                </div>

                {/* Right Controls */}
                <div className="flex items-center gap-3.5 md:gap-4.5">
                  {/* Bilingual Toggle Switch */}
                  {!minimal && (
                    <div className="flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-[12px] font-semibold text-white border border-white/10 backdrop-blur-md">
                      <Languages className="h-[18px] w-[18px]" />
                      <span className="hidden sm:inline">Bilingual</span>
                      <button 
                        onClick={() => setBilingual(prev => !prev)}
                        className={cn(
                          "relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                          bilingual ? "bg-[#f00]" : "bg-white/20"
                        )}
                      >
                        <span
                          className={cn(
                            "pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                            bilingual ? "translate-x-3" : "translate-x-0"
                          )}
                        />
                      </button>
                    </div>
                  )}

                  {/* Autoplay Toggle Switch */}
                  {!minimal && (
                    <button 
                      onClick={() => setAutoplay(!autoplay)}
                      className="group/autoplay relative flex items-center justify-center p-1.5 text-white/70 hover:text-white transition-colors"
                      title={autoplay ? "Autoplay is on" : "Autoplay is off"}
                    >
                      <div className={cn(
                        "w-9 h-[18px] rounded-full transition-colors relative",
                        autoplay ? "bg-[#f00]" : "bg-white/30"
                      )}>
                        <div className={cn(
                          "absolute top-0.5 left-0.5 w-[14px] h-[14px] rounded-full bg-white transition-all flex items-center justify-center",
                          autoplay ? "translate-x-4.5" : "translate-x-0"
                        )}>
                          {autoplay ? (
                            <div className="w-1.5 h-1.5 bg-[#f00] rounded-full" />
                          ) : (
                            <div className="w-1.5 h-1.5 bg-neutral-600 rounded-full" />
                          )}
                        </div>
                      </div>
                    </button>
                  )}

                  {/* Subtitles CC Button */}
                  <button 
                    onClick={toggleCC} 
                    className={cn(
                      "flex items-center justify-center h-9 w-9 rounded-md transition-colors",
                      ccEnabled ? "text-[#f00]" : "text-white/70 hover:text-white"
                    )}
                    title="Subtitles/closed captions (c)"
                  >
                    <span className="text-[11px] font-bold tracking-tight border-2 border-current px-1 py-0.5 rounded">CC</span>
                  </button>

                  {/* Settings gear */}
                  <button 
                    onClick={(e) => { e.stopPropagation(); setShowSettings(!showSettings); setSettingsView("main"); }}
                    className={cn("text-white/70 transition-all hover:text-white flex items-center justify-center h-9 w-9", showSettings && "rotate-90 text-[#f00]")}
                    title="Settings"
                  >
                    <Settings className="h-[25px] w-[25px]" />
                  </button>

                  {/* Picture in Picture (Only for HTML5) */}
                  {isHtml5 && !minimal && (
                    <button onClick={togglePip} className="text-white/70 hover:text-white transition-colors flex items-center justify-center h-9 w-9" title="Picture-in-picture">
                      <Monitor className="h-[25px] w-[25px]" />
                    </button>
                  )}

                  {/* Theater Mode Button */}
                  {!minimal && (
                    <button 
                      onClick={toggleTheaterMode} 
                      className="text-white/70 hover:text-white transition-colors flex items-center justify-center h-9 w-9"
                      title="Theater mode (t)"
                    >
                      {isTheaterMode ? (
                        <svg viewBox="0 0 36 36" className="h-[28px] w-[28px] fill-current">
                          <path d="M 28,11 8,11 8,25 28,25 z m -2,12 -12,0 0,-8 12,0 z" fillRule="evenodd" />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 36 36" className="h-[28px] w-[28px] fill-current">
                          <path d="m 26,13 0,10 -16,0 0,-10 z m -18,-2 0,14 20,0 0,-14 z" fillRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  )}

                  {/* Fullscreen Button */}
                  <button 
                    onClick={toggleFullscreen} 
                    className="text-white/70 hover:text-white transition-colors flex items-center justify-center h-9 w-9"
                    title={isFullscreen ? "Exit full screen (f)" : "Full screen (f)"}
                  >
                    {isFullscreen ? (
                      <svg viewBox="0 0 36 36" className="h-[28px] w-[28px] fill-current">
                        <path d="m 14,14 -4,0 0,2 6,0 0,-6 -2,0 0,4 0,0 z m 0,8 -2,0 0,4 2,0 0,-4 4,0 0,-2 -6,0 0,2 0,0 z m 8,-8 2,0 0,-4 -2,0 0,6 6,0 0,-2 -6,0 0,0 z m 0,8 0,4 2,0 0,-4 4,0 0,-2 -6,0 0,2 0,0 z" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 36 36" className="h-[28px] w-[28px] fill-current">
                        <path d="m 10,16 2,0 0,-4 4,0 0,-2 -6,0 0,6 0,0 z m 0,4 0,6 6,0 0,-2 -4,0 0,-4 -2,0 0,0 z m 14,-8 0,4 2,0 0,-6 -6,0 0,2 4,0 0,0 z m -4,14 6,0 0,-6 -2,0 0,4 -4,0 0,2 0,0 z" />
                      </svg>
                    )}
                  </button>
                </div>

              </div>
            </div>

            {/* Settings Menu Popup */}
            <AnimatePresence>
              {showSettings && (
                <motion.div
                  key="settings-popup"
                  initial={{ opacity: 0, scale: 0.9, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 10 }}
                  className="absolute bottom-14 right-4 w-52 rounded-xl border border-white/[0.05] bg-black/95 p-1.5 shadow-2xl backdrop-blur-xl z-[90]"
                  onClick={(e) => e.stopPropagation()}
                >
                  {settingsView === "main" ? (
                    <div className="flex flex-col gap-0.5">
                      <button onClick={() => setSettingsView("quality")} className="flex items-center justify-between rounded-lg px-3 py-2 text-white hover:bg-white/10">
                        <div className="flex items-center gap-2.5"><Gauge className="h-4 w-4 text-white/60" /><span className="text-xs font-semibold">Quality</span></div>
                        <div className="flex items-center gap-1 text-[10px] text-white/40">{mapYouTubeQuality(selectedQuality)} <ChevronRight className="h-3 w-3" /></div>
                      </button>
                      <button onClick={() => setSettingsView("speed")} className="flex items-center justify-between rounded-lg px-3 py-2 text-white hover:bg-white/10">
                        <div className="flex items-center gap-2.5"><Gauge className="h-4 w-4 text-white/60" /><span className="text-xs font-semibold">Speed</span></div>
                        <div className="flex items-center gap-1 text-[10px] text-white/40">{playbackRate}x <ChevronRight className="h-3 w-3" /></div>
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col">
                      <button onClick={() => setSettingsView("main")} className="flex items-center gap-2.5 border-b border-white/[0.05] px-3 py-2 text-white hover:bg-white/10">
                        <ArrowLeft className="h-3.5 w-3.5 text-white/60" /><span className="text-xs font-bold">Back</span>
                      </button>
                      <div className="max-h-48 overflow-y-auto py-1">
                        {settingsView === "quality" && availableQualities.map(q => (
                          <button key={q} onClick={() => { 
                            setSelectedQuality(q); 
                            if (ytPlayerRef.current?.setPlaybackQualityRange) {
                              ytPlayerRef.current.setPlaybackQualityRange(q, q);
                            } else if (ytPlayerRef.current?.setPlaybackQuality) {
                              ytPlayerRef.current.setPlaybackQuality(q);
                            }
                            setSettingsView("main"); 
                            setShowSettings(false);
                          }} className="flex w-full items-center justify-between px-3 py-2 text-xs text-white hover:bg-white/10">
                            <span>{mapYouTubeQuality(q)}</span>
                            {selectedQuality === q && <Check className="h-3.5 w-3.5 text-[#f00]" />}
                          </button>
                        ))}
                        {settingsView === "speed" && availableRates.map(r => (
                          <button key={r} onClick={() => {
                            setPlaybackRate(r);
                            if (ytPlayerRef.current?.setPlaybackRate) ytPlayerRef.current.setPlaybackRate(r);
                            if (videoRef.current) videoRef.current.playbackRate = r;
                            setSettingsView("main");
                            setShowSettings(false);
                          }} className="flex w-full items-center justify-between px-3 py-2 text-xs text-white hover:bg-white/10">
                            <span>{r}x</span>
                            {playbackRate === r && <Check className="h-3.5 w-3.5 text-[#f00]" />}
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
  </div>
  );
}
