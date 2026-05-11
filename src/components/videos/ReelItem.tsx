"use client";

import React, { useState, useRef, useEffect } from "react";
import { 
  Heart, 
  ChatCircle, 
  ShareNetwork, 
  MusicNotes, 
  UserPlus,
  Play,
  Pause,
  SpeakerHigh,
  SpeakerX,
  Plus
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { ProfessionalVideoPlayer } from "@/components/ui/ProfessionalVideoPlayer";

interface ReelItemProps {
  id?: string;
  videoUrl: string;
  authorName: string;
  authorImage?: string;
  caption: string;
  likes: number;
  comments: number;
  isLiked?: boolean;
  isActive: boolean;
  startTime?: number;
  endTime?: number;
}

export function ReelItem({ 
  videoUrl, 
  authorName, 
  authorImage, 
  caption, 
  likes: initialLikes, 
  comments, 
  isLiked: initialIsLiked = false,
  isActive,
  startTime,
  endTime
}: ReelItemProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [likes, setLikes] = useState(initialLikes);
  const [isMuted, setIsMuted] = useState(true);
  const [showHeartOverlay, setShowHeartOverlay] = useState(false);

  useEffect(() => {
    if (isActive) {
      setIsPlaying(true);
      // For local video element fallback
      if (videoRef.current) {
        videoRef.current.play().catch(() => {});
      }
    } else {
      setIsPlaying(false);
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
    }
  }, [isActive]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleDoubleClick = () => {
    if (!isLiked) {
      setIsLiked(true);
      setLikes(prev => prev + 1);
    }
    setShowHeartOverlay(true);
    setTimeout(() => setShowHeartOverlay(false), 800);
  };

  const toggleLike = () => {
    setIsLiked(!isLiked);
    setLikes(prev => isLiked ? prev - 1 : prev + 1);
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMuted(!isMuted);
    if (videoRef.current) videoRef.current.muted = !isMuted;
  };

  return (
    <div 
      className="relative w-full h-full bg-black snap-start overflow-hidden flex items-center justify-center"
      onDoubleClick={handleDoubleClick}
    >
      {/* Video Content with Masking */}
      <div className="relative w-full h-full">
        {videoUrl.includes("youtube.com") || videoUrl.includes("youtu.be") || videoUrl.includes(".mp4") ? (
           <ProfessionalVideoPlayer 
             src={videoUrl} 
             playing={isActive && isPlaying} 
             muted={isMuted}
             startTime={startTime}
             endTime={endTime}
             minimal={true}
             className="w-full h-full rounded-none border-none" 
           />
        ) : (
          <video
            ref={videoRef}
            src={videoUrl}
            className="w-full h-full object-cover"
            loop
            playsInline
            muted={isMuted}
            onClick={togglePlay}
          />
        )}
        
        {/* Click Blocker / Interaction Layer */}
        <div 
          className="absolute inset-0 z-[5] cursor-pointer" 
          onClick={togglePlay}
          onDoubleClick={handleDoubleClick}
        />
      </div>

      {/* Play/Pause Indicator Overlay */}
      <AnimatePresence>
        {!isPlaying && isActive && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <div className="h-20 w-20 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white">
              <Play size={40} weight="fill" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Double Tap Heart Overlay */}
      <AnimatePresence>
        {showHeartOverlay && (
          <motion.div 
            initial={{ opacity: 0, scale: 0, y: 0 }}
            animate={{ opacity: 1, scale: 1.5, y: -20 }}
            exit={{ opacity: 0, scale: 2, y: -50 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-50"
          >
            <Heart size={100} weight="fill" className="text-red-500 drop-shadow-[0_0_20px_rgba(239,68,68,0.6)]" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Right Side Actions - Premium Styled */}
      <div className="absolute right-4 bottom-24 flex flex-col items-center gap-6 z-20">
        {/* Mute Toggle */}
        <div className="flex flex-col items-center gap-1.5 mb-2">
          <button 
            onClick={toggleMute}
            className="h-12 w-12 rounded-xl bg-white/5 backdrop-blur-2xl border border-white/10 flex items-center justify-center text-white transition-all active:scale-90 hover:bg-white/10"
          >
            {isMuted ? <SpeakerX size={26} weight="thin" /> : <SpeakerHigh size={26} weight="thin" />}
          </button>
        </div>

        <div className="flex flex-col items-center gap-1.5">
          <button 
            onClick={(e) => { e.stopPropagation(); toggleLike(); }}
            className={cn(
              "h-14 w-14 rounded-2xl flex items-center justify-center backdrop-blur-2xl transition-all active:scale-90 border shadow-2xl",
              isLiked 
                ? "text-red-500 bg-red-500/20 border-red-500/30" 
                : "text-white bg-white/10 border-white/10 hover:bg-white/20"
            )}
          >
            <Heart size={34} weight={isLiked ? "fill" : "thin"} className="drop-shadow-lg" />
          </button>
          <span className="text-white text-[11px] font-black drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] uppercase tracking-wider">{likes}</span>
        </div>

        <div className="flex flex-col items-center gap-1.5">
          <button className="h-14 w-14 rounded-2xl bg-white/10 backdrop-blur-2xl border border-white/10 flex items-center justify-center text-white transition-all active:scale-90 hover:bg-white/20 border-white/10 shadow-2xl">
            <ChatCircle size={34} weight="thin" className="drop-shadow-lg" />
          </button>
          <span className="text-white text-[11px] font-black drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] uppercase tracking-wider">{comments}</span>
        </div>

        <div className="flex flex-col items-center gap-1.5">
          <button className="h-14 w-14 rounded-2xl bg-white/10 backdrop-blur-2xl border border-white/10 flex items-center justify-center text-white transition-all active:scale-90 hover:bg-white/20 border-white/10 shadow-2xl">
            <ShareNetwork size={34} weight="thin" className="drop-shadow-lg" />
          </button>
          <span className="text-white text-[11px] font-black drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] uppercase tracking-wider">Share</span>
        </div>

        <div className="mt-4 group relative">
          <div className="h-14 w-14 rounded-2xl bg-primary/20 backdrop-blur-2xl border-2 border-white/40 overflow-hidden shadow-2xl group-hover:scale-110 transition-all">
            <img src={authorImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${authorName}`} className="h-full w-full object-cover" alt="" />
          </div>
          <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-primary border-2 border-black flex items-center justify-center text-white">
            <Plus size={10} weight="bold" />
          </div>
        </div>
      </div>

      {/* Bottom Content */}
      <div className="absolute bottom-0 left-0 right-0 p-6 pt-20 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-10 pointer-events-none">
        <div className="flex items-center gap-3 mb-3 pointer-events-auto">
          <span className="text-white font-black text-lg drop-shadow-md">@{authorName}</span>
          <button className="px-3 py-1 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 text-white text-[10px] font-black uppercase tracking-widest hover:bg-white/20 transition-all">
            Follow
          </button>
        </div>
        <p className="text-white/90 text-sm font-medium leading-relaxed max-w-[85%] drop-shadow-md mb-4 pointer-events-auto">
          {caption}
        </p>
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="h-6 w-6 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center">
            <MusicNotes size={14} className="text-white animate-pulse" />
          </div>
          <div className="flex-1 overflow-hidden">
            <div className="text-white/70 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap animate-marquee">
              MedOneX Original Studio Audio — {authorName}
            </div>
          </div>
        </div>
      </div>

      {/* Top Controls (Mute/Close) */}
      <div className="absolute top-6 right-6 z-20 flex gap-3">
        <button 
          onClick={(e) => { e.stopPropagation(); setIsMuted(!isMuted); }}
          className="h-10 w-10 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center text-white border border-white/10"
        >
          {isMuted ? <SpeakerX size={20} /> : <SpeakerHigh size={20} />}
        </button>
      </div>

      <style jsx>{`
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee {
          display: inline-block;
          animation: marquee 10s linear infinite;
        }
      `}</style>
    </div>
  );
}
