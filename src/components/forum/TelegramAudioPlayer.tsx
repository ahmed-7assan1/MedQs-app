"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { 
  Play, 
  Pause, 
  SpeakerHigh, 
  SpeakerSlash, 
  FastForward,
  Check
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  url: string;
  duration?: number;
  className?: string;
}

export function TelegramAudioPlayer({ url, duration: initialDuration, className }: Props) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(initialDuration || 0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement>(null);

  // Generate "Waveform" bars
  const bars = useMemo(() => {
    return Array.from({ length: 40 }).map(() => Math.random() * 0.6 + 0.2);
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => {
        if (!initialDuration) setDuration(audio.duration);
    };
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [initialDuration]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (index: number) => {
    if (!audioRef.current || duration === 0) return;
    const seekTime = (index / bars.length) * duration;
    audioRef.current.currentTime = seekTime;
    setCurrentTime(seekTime);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const toggleSpeed = () => {
    const rates = [1, 1.5, 2];
    const nextRate = rates[(rates.indexOf(playbackRate) + 1) % rates.length];
    setPlaybackRate(nextRate);
    if (audioRef.current) audioRef.current.playbackRate = nextRate;
  };

  return (
    <div className={cn(
      "relative flex items-center gap-4 p-3 rounded-2xl bg-white/[0.03] border border-white/[0.05] backdrop-blur-md max-w-full overflow-hidden group",
      className
    )}>
      <audio ref={audioRef} src={url} preload="metadata" />

      {/* Play Button */}
      <button 
        onClick={togglePlay}
        className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-full bg-[#534AB7] text-white shadow-lg hover:scale-105 active:scale-95 transition-all"
      >
        {isPlaying ? <Pause size={20} weight="fill" /> : <Play size={20} weight="fill" className="ml-0.5" />}
      </button>

      {/* Info & Waveform */}
      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-[#AFA9EC] uppercase tracking-widest">Voice Note</span>
            <span className="text-[10px] font-bold text-white/20">{formatTime(currentTime)} / {formatTime(duration)}</span>
        </div>

        {/* Waveform Visualization */}
        <div className="flex items-end gap-[2px] h-6 cursor-pointer group/wave">
            {bars.map((height, i) => {
                const progress = (currentTime / duration) || 0;
                const isPlayed = (i / bars.length) < progress;
                return (
                    <div 
                        key={i}
                        onClick={() => handleSeek(i)}
                        className={cn(
                            "flex-1 rounded-full transition-all duration-300",
                            isPlayed ? "bg-[#534AB7]" : "bg-white/10 group-hover/wave:bg-white/20"
                        )}
                        style={{ height: `${height * 100}%` }}
                    />
                );
            })}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-1.5">
          <button 
            onClick={toggleSpeed}
            className="px-2 py-1 rounded-lg bg-white/5 text-[10px] font-black text-[#AFA9EC] hover:bg-white/10 transition-all border border-white/5"
          >
            {playbackRate}x
          </button>
          
          <button 
            onClick={() => setIsMuted(!isMuted)}
            className="p-2 text-white/20 hover:text-white transition-colors"
          >
            {isMuted ? <SpeakerSlash size={18} /> : <SpeakerHigh size={18} />}
          </button>
      </div>

      {/* Progress Line */}
      <div className="absolute bottom-0 left-0 h-[2px] bg-[#534AB7]/30 transition-all" style={{ width: `${(currentTime / duration) * 100}%` }} />
    </div>
  );
}
