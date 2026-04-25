"use client";

import { useAudioStore } from "@/lib/store";
import { 
  Play, Pause, X, ChevronUp, ChevronDown, 
  Music, Headphones, Maximize2, Minimize2, ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";

const ReactPlayer = dynamic(() => import("react-player"), { ssr: false });

export function PersistentAudioPlayer() {
  const { currentTrack, isPlaying, isMinimized, setIsPlaying, setMinimized, setProgress, stop } = useAudioStore();
  const [mounted, setMounted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ytPlayerRef = useRef<any>(null);
  
  const isYouTube = useMemo(() => {
    if (!currentTrack?.url) return false;
    const url = currentTrack.url.toLowerCase();
    return (
      url.includes("youtube.com") || 
      url.includes("youtu.be") || 
      url.includes("youtube-nocookie.com")
    );
  }, [currentTrack?.url]);

  const finalAudioUrl = useMemo(() => {
    if (!currentTrack?.url) return "";
    const driveMatch = currentTrack.url.match(/drive\.google\.com\/(?:file\/d\/|open\?id=)([^/&?]+)/);
    if (driveMatch) return `https://drive.google.com/uc?export=download&id=${driveMatch[1]}`;
    return currentTrack.url;
  }, [currentTrack?.url]);
  
  // Local state for immediate responsiveness
  const [localCurrentTime, setLocalCurrentTime] = useState(0);
  const [localDuration, setLocalDuration] = useState(0);

  useEffect(() => {
    setProgress(localCurrentTime, localDuration);
  }, [localCurrentTime, localDuration, setProgress]);

  useEffect(() => { setMounted(true); }, []);

  const spotifyEmbedUrl = useMemo(() => {
    if (!currentTrack?.isSpotify) return null;
    const match = currentTrack.url.match(/spotify\.com\/(track|episode|album|show|playlist)\/([a-zA-Z0-9]+)/);
    if (!match) return null;
    return `https://open.spotify.com/embed/${match[1]}/${match[2]}`;
  }, [currentTrack]);

  // Handle local playback for HTML Audio
  useEffect(() => {
    if (!audioRef.current || !currentTrack || currentTrack.isSpotify || isYouTube) return;
    
    // Reset state when track changes
    setLocalCurrentTime(0);
    setLocalDuration(0);
    
    // Explicitly load the new source
    audioRef.current.load();


    if (isPlaying) {
      audioRef.current.play().catch((err) => {
        console.error("[PersistentAudioPlayer] Playback failed:", err);
        setIsPlaying(false);
      });
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, currentTrack?.url, setIsPlaying, isYouTube]); // Depend on currentTrack.url specifically

  if (!mounted || !currentTrack) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className={cn(
          "fixed left-4 right-4 md:left-auto md:right-8 bottom-24 md:bottom-8 z-[100] transition-all duration-500",
          isMinimized ? "md:w-72" : "md:w-[450px]"
        )}
      >
        <div className="relative group overflow-hidden rounded-3xl bg-black/60 backdrop-blur-2xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          {/* Glass Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent pointer-events-none" />

          {/* Player Content */}
          <div className="relative p-4">
            {!isMinimized && currentTrack.isSpotify ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center">
                      <Music className="h-3 w-3 text-primary" />
                    </div>
                    <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Now Streaming</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setMinimized(true)} className="p-1.5 hover:bg-white/5 rounded-full text-white/40 hover:text-white transition-colors">
                      <Minimize2 className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={stop} className="p-1.5 hover:bg-white/5 rounded-full text-white/40 hover:text-white transition-colors">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="relative rounded-2xl overflow-hidden bg-black/20 border border-white/5">
                  <iframe
                    src={spotifyEmbedUrl!}
                    width="100%"
                    height="152"
                    frameBorder="0"
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    loading="lazy"
                    className="relative z-10"
                  ></iframe>
                  <div className="absolute top-2 right-2 h-8 w-8 bg-[#282828] z-20 rounded-full" /> 
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                {/* Artwork */}
                <div className="h-14 w-14 shrink-0 rounded-xl overflow-hidden border border-white/10 shadow-lg relative group/art">
                  {currentTrack.image ? (
                    <img src={currentTrack.image} className="h-full w-full object-cover" alt="" />
                  ) : (
                    <div className="h-full w-full bg-primary/10 flex items-center justify-center">
                      <Headphones className="h-6 w-6 text-primary/40" />
                    </div>
                  )}
                  {isMinimized && (
                    <button 
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/art:opacity-100 transition-opacity"
                    >
                      {isPlaying ? <Pause className="h-5 w-5 text-white" /> : <Play className="h-5 w-5 text-white ml-0.5" />}
                    </button>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-[13px] font-bold text-white truncate leading-tight">{currentTrack.title}</h4>
                  <p className="text-[11px] text-white/40 truncate mt-0.5">
                    {isYouTube ? "YouTube Audio" : (currentTrack.artist || "Academic Audio")}
                  </p>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-1">
                  {!isMinimized && (
                    <button 
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="h-10 w-10 flex items-center justify-center rounded-full bg-white text-black hover:scale-105 transition-transform"
                    >
                      {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
                    </button>
                  )}
                  
                  {isMinimized ? (
                    <button onClick={() => setMinimized(false)} className="p-2 hover:bg-white/5 rounded-full text-white/40 hover:text-white transition-colors">
                      <Maximize2 className="h-4 w-4" />
                    </button>
                  ) : (
                    <button onClick={() => setMinimized(true)} className="p-2 hover:bg-white/5 rounded-full text-white/40 hover:text-white transition-colors">
                      <Minimize2 className="h-4 w-4" />
                    </button>
                  )}
                  
                  <button onClick={stop} className="p-2 hover:bg-white/5 rounded-full text-white/40 hover:text-white transition-colors">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* Progress Bar (Native & YouTube) */}
          {!currentTrack.isSpotify && (
             <div className="h-1 w-full bg-white/5">
                <div 
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${(localCurrentTime / (localDuration || 1)) * 100}%` }}
                />
             </div>
          )}
        </div>

        {/* Hidden Native Audio Element */}
        {!currentTrack.isSpotify && !isYouTube && (
          <audio
            ref={audioRef}
            src={finalAudioUrl}

            onTimeUpdate={() => setLocalCurrentTime(audioRef.current?.currentTime || 0)}
            onLoadedMetadata={() => setLocalDuration(audioRef.current?.duration || 0)}
            onEnded={() => setIsPlaying(false)}
            className="hidden"
          />
        )}

        {/* YouTube Audio Player (Tiny but not hidden to avoid browser blocks) */}
        {isYouTube && (
          <div 
            className="pointer-events-none absolute" 
            style={{ 
              opacity: 0.01, 
              width: "128px", 
              height: "128px", 
              left: "-9999px",
              top: "-9999px",
              overflow: 'hidden' 
            }}
          >
            <ReactPlayer
              key={currentTrack.url}
              ref={ytPlayerRef}
              url={currentTrack.url}
              playing={isPlaying}
              onProgress={({ playedSeconds }: any) => setLocalCurrentTime(playedSeconds)}
              onDuration={(d: number) => setLocalDuration(d)}
              onEnded={() => setIsPlaying(false)}
              onError={(e: any) => console.error("YouTube Player Error:", e)}
              width="100%"
              height="100%"
              config={{
                youtube: {
                  playerVars: { 
                    autoplay: 1,
                    controls: 0,
                    showinfo: 0,
                    modestbranding: 1,
                    origin: typeof window !== "undefined" ? window.location.origin : undefined,
                    playsinline: 1
                  }
                }
              }}
            />
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
