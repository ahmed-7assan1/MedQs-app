"use client";

import React, { useState, useRef, useEffect } from "react";
import { 
  Play, 
  Pause, 
  SpeakerHigh, 
  SpeakerX, 
  CircleNotch,
  CornersOut,
  CornersIn,
  Gear
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface VideoPlayerProps {
  src: string;
  poster?: string;
  className?: string;
  playing?: boolean;
  minimal?: boolean;
  muted?: boolean;
  startTime?: number;
  endTime?: number;
}

function extractYouTubeId(url: string): string | null {
  const match = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|v\/))([a-zA-Z0-9_-]{11})/
  );
  return match ? match[1] : null;
}

export function ProfessionalVideoPlayer({ 
  src, 
  poster, 
  className, 
  playing, 
  minimal,
  muted = true,
  startTime = 0,
  endTime
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isMuted, setIsMuted] = useState(muted);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSettings, setShowSettings] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [duration, setDuration] = useState(0);

  const ytId = extractYouTubeId(src);

  useEffect(() => {
    setIsMuted(muted);
    if (videoRef.current) {
      videoRef.current.muted = muted;
      videoRef.current.volume = volume;
    }
  }, [muted, volume]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackRate;
    }
    if (ytId && iframeRef.current) {
      iframeRef.current.contentWindow?.postMessage(JSON.stringify({ event: 'command', func: 'setPlaybackRate', args: [playbackRate] }), '*');
    }
  }, [playbackRate, ytId]);

  const togglePlay = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (ytId) {
       if (isPlaying) {
         iframeRef.current?.contentWindow?.postMessage(JSON.stringify({ event: 'command', func: 'pauseVideo' }), '*');
       } else {
         iframeRef.current?.contentWindow?.postMessage(JSON.stringify({ event: 'command', func: 'playVideo' }), '*');
       }
       setIsPlaying(!isPlaying);
       return;
    }
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const current = videoRef.current.currentTime;
    const total = videoRef.current.duration;
    setProgress((current / total) * 100);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current || !containerRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = x / rect.width;
    videoRef.current.currentTime = pct * videoRef.current.duration;
    setProgress(pct * 100);
  };

  const toggleFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    if (playing !== undefined) {
      if (playing) {
        if (ytId && iframeRef.current) {
           iframeRef.current.contentWindow?.postMessage(JSON.stringify({ event: 'command', func: 'playVideo' }), '*');
           setIsPlaying(true);
        } else if (videoRef.current) {
          if (startTime && videoRef.current.currentTime < startTime) {
            videoRef.current.currentTime = startTime;
          }
          videoRef.current.play().catch(() => {});
          setIsPlaying(true);
        }
      } else {
        if (ytId && iframeRef.current) {
          iframeRef.current.contentWindow?.postMessage(JSON.stringify({ event: 'command', func: 'pauseVideo' }), '*');
          setIsPlaying(false);
        } else if (videoRef.current) {
          videoRef.current.pause();
          setIsPlaying(false);
        }
      }
    }
  }, [playing, ytId, startTime]);

  useEffect(() => {
    const checkSegments = () => {
      if (playing) {
        if (!ytId && videoRef.current) {
           if (endTime && videoRef.current.currentTime >= endTime) {
             if (startTime !== undefined) {
               videoRef.current.currentTime = startTime;
             } else {
               videoRef.current.pause();
               setIsPlaying(false);
             }
           }
        }
      }
    };
    const interval = setInterval(checkSegments, 200);
    return () => clearInterval(interval);
  }, [playing, ytId, startTime, endTime]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000);
    return () => clearTimeout(timeout);
  }, [isPlaying, showControls]);

  return (
    <div 
      ref={containerRef}
      className={cn(
        "relative group bg-black rounded-[24px] overflow-hidden shadow-2xl border border-white/10 select-none w-full",
        className
      )}
      style={{ aspectRatio: "16/9" }}
      onMouseMove={() => setShowControls(true)}
      onClick={() => setShowControls(true)}
    >
      {/* Video Content */}
      {ytId ? (
        <div className="absolute inset-0 w-full h-full bg-black overflow-hidden">
          <iframe
            ref={iframeRef}
            src={`https://www.youtube.com/embed/${ytId}?autoplay=${playing ? 1 : 0}&mute=1&controls=0&modestbranding=1&playsinline=1&rel=0&iv_load_policy=3&disablekb=1&enablejsapi=1${startTime ? `&start=${startTime}` : ""}${endTime ? `&end=${endTime}` : ""}`}
            className="w-full h-full scale-[1.5] origin-center"
            allow="autoplay; encrypted-media"
            onLoad={() => setIsLoading(false)}
          />
          <div className="absolute inset-0 z-10 bg-transparent cursor-pointer" onClick={togglePlay} />
        </div>
      ) : (
          <video
            ref={videoRef}
            src={src}
            poster={poster}
            className="w-full h-full object-contain cursor-pointer absolute inset-0"
            onTimeUpdate={handleTimeUpdate}
            onWaiting={() => setIsLoading(true)}
            onCanPlay={() => {
              setIsLoading(false);
              setDuration(videoRef.current?.duration || 0);
            }}
            onError={(e) => {
              console.error("Video playback error:", e);
              setIsLoading(false);
            }}
            onEnded={() => setIsPlaying(false)}
            onClick={togglePlay}
            playsInline
          />
      )}

      {/* Loading Spinner */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[2px] z-10">
          <CircleNotch size={48} className="text-primary animate-spin" />
        </div>
      )}

      {/* Play/Pause Overlay */}
      <AnimatePresence>
        {!isPlaying && !isLoading && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.2 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
          >
            <button 
              onClick={togglePlay}
              className="h-20 w-20 rounded-full bg-primary/90 text-white flex items-center justify-center shadow-[0_0_30px_rgba(108,95,240,0.4)] pointer-events-auto hover:scale-110 transition-transform"
            >
              <Play size={40} weight="fill" className="ml-1" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Badge */}
      {!minimal && (
        <div className="absolute top-4 left-4 z-30 pointer-events-none">
          <div className="px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">MedOneX Studio</span>
          </div>
        </div>
      )}

      {/* Controls */}
      <AnimatePresence>
        {!minimal && (showControls || !isPlaying) && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-0 inset-x-0 p-4 pt-12 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-40"
          >
            <div 
              className="group relative h-1.5 w-full bg-white/20 rounded-full mb-4 cursor-pointer overflow-hidden"
              onClick={handleSeek}
            >
              <div 
                className="absolute top-0 left-0 h-full bg-primary rounded-full transition-all duration-100"
                style={{ width: `${progress}%` }}
              />
              <div className="absolute top-0 left-0 w-full h-full bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <button onClick={togglePlay} className="text-white hover:text-primary transition-colors">
                  {isPlaying ? <Pause size={24} weight="fill" /> : <Play size={24} weight="fill" />}
                </button>
                
                <div className="flex items-center gap-2 group/volume">
                  <button onClick={() => setIsMuted(!isMuted)} className="text-white hover:text-primary transition-colors">
                    {isMuted || volume === 0 ? <SpeakerX size={24} weight="fill" /> : <SpeakerHigh size={24} weight="fill" />}
                  </button>
                  <input 
                    type="range" 
                    min="0" 
                    max="1" 
                    step="0.1" 
                    value={isMuted ? 0 : volume} 
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      setVolume(v);
                      if (v > 0) setIsMuted(false);
                    }}
                    className="w-0 group-hover/volume:w-20 transition-all duration-300 accent-primary h-1 cursor-pointer bg-white/20 rounded-full appearance-none"
                  />
                </div>

                <div className="text-white/80 text-[11px] font-black font-mono">
                  {formatTime((videoRef.current?.currentTime || 0))} / {formatTime(duration)}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="relative">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setShowSettings(!showSettings); }}
                    className={cn("flex items-center gap-1.5 px-2 py-1 rounded-lg transition-all", showSettings ? "bg-primary text-white" : "text-white/60 hover:text-white hover:bg-white/10")}
                  >
                    <Gear size={20} weight="fill" />
                    <span className="text-[10px] font-black">{playbackRate}x</span>
                  </button>

                  <AnimatePresence>
                    {showSettings && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute bottom-full right-0 mb-2 w-32 bg-black/90 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden p-1 shadow-2xl z-50"
                      >
                        <p className="text-[9px] font-black text-white/40 uppercase tracking-widest p-2 border-b border-white/5">Speed</p>
                        {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                          <button
                            key={rate}
                            onClick={(e) => { e.stopPropagation(); setPlaybackRate(rate); setShowSettings(false); }}
                            className={cn(
                              "w-full text-left px-3 py-2 rounded-lg text-[11px] font-bold transition-all",
                              playbackRate === rate ? "bg-primary text-white" : "text-white/60 hover:bg-white/10 hover:text-white"
                            )}
                          >
                            {rate === 1 ? "Normal" : `${rate}x`}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <button onClick={toggleFullscreen} className="text-white/60 hover:text-white transition-colors">
                  {isFullscreen ? <CornersIn size={24} weight="fill" /> : <CornersOut size={24} weight="fill" />}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
