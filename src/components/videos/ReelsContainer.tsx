"use client";

import React, { useState, useRef, useEffect } from "react";
import { ReelItem } from "./ReelItem";
import { ArrowLeft, CaretUp, CaretDown } from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface ReelData {
  id: string;
  videoUrl: string;
  authorName: string;
  authorImage?: string;
  caption: string;
  likes: number;
  comments: number;
  isLiked?: boolean;
}

interface ReelsContainerProps {
  reels: ReelData[];
  initialIndex?: number;
}

export function ReelsContainer({ reels, initialIndex = 0 }: ReelsContainerProps) {
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const handleScroll = () => {
    if (!containerRef.current) return;
    const scrollPos = containerRef.current.scrollTop;
    const height = containerRef.current.clientHeight;
    const newIndex = Math.round(scrollPos / height);
    if (newIndex !== activeIndex) {
      setActiveIndex(newIndex);
    }
  };

  const scrollToNext = () => {
    if (activeIndex < reels.length - 1) {
      containerRef.current?.scrollTo({
        top: (activeIndex + 1) * containerRef.current.clientHeight,
        behavior: "smooth"
      });
    }
  };

  const scrollToPrev = () => {
    if (activeIndex > 0) {
      containerRef.current?.scrollTo({
        top: (activeIndex - 1) * containerRef.current.clientHeight,
        behavior: "smooth"
      });
    }
  };

  useEffect(() => {
    // Hide All Navigation Elements for Full Screen Immersion
    const mobileHeader = document.querySelector('header');
    const desktopNav = document.getElementById('desktop-nav-island');
    
    if (mobileHeader) mobileHeader.style.display = 'none';
    if (desktopNav) desktopNav.style.display = 'none';
    document.body.style.overflow = 'hidden';
    
    return () => {
      if (mobileHeader) mobileHeader.style.display = '';
      if (desktopNav) desktopNav.style.display = '';
      document.body.style.overflow = 'auto';
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[1000] bg-black flex items-center justify-center overflow-hidden">
      
      {/* Immersive Blurred Background (Desktop Only) */}
      <div className="hidden md:block absolute inset-0 z-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="absolute inset-0"
          >
            <img 
              src={`https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?q=80&w=1000`} 
              className="w-full h-full object-cover blur-[100px] scale-110"
              alt=""
            />
          </motion.div>
        </AnimatePresence>
        <div className="absolute inset-0 bg-black/40 backdrop-blur-3xl" />
      </div>

      {/* Back Button */}
      <button 
        onClick={() => router.back()}
        className="absolute top-6 left-6 z-[110] h-12 w-12 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center text-white border border-white/10 hover:bg-black/40 transition-all shadow-2xl"
      >
        <ArrowLeft size={24} weight="bold" />
      </button>

      {/* Main Reels Feed */}
      <div 
        ref={containerRef}
        onScroll={handleScroll}
        className="relative w-full h-full max-w-[500px] bg-black/80 md:rounded-[40px] md:my-8 md:h-[calc(100vh-64px)] snap-y snap-mandatory overflow-y-scroll no-scrollbar shadow-[0_0_80px_rgba(0,0,0,0.8)] border-x border-white/5 z-10"
      >
        {reels.map((reel, idx) => {
          // Virtualization: Only render the active reel and 2 neighbors to save memory
          const isNearActive = Math.abs(idx - activeIndex) <= 2;
          if (!isNearActive) return <div key={reel.id} className="h-full w-full snap-start" />;

          return (
            <ReelItem 
              key={reel.id}
              videoUrl={reel.videoUrl}
              authorName={reel.authorName}
              authorImage={reel.authorImage}
              caption={reel.caption}
              likes={reel.likes}
              comments={reel.comments}
              isLiked={reel.isLiked}
              isActive={idx === activeIndex}
            />
          );
        })}
      </div>

      {/* Desktop Navigation Hints */}
      <div className="hidden md:flex flex-col gap-4 ml-8">
        <button 
          onClick={scrollToPrev}
          disabled={activeIndex === 0}
          className="h-14 w-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-white/10 disabled:opacity-20 transition-all"
        >
          <CaretUp size={32} />
        </button>
        <button 
          onClick={scrollToNext}
          disabled={activeIndex === reels.length - 1}
          className="h-14 w-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-white/10 disabled:opacity-20 transition-all"
        >
          <CaretDown size={32} />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="absolute right-0 top-0 bottom-0 w-1 flex flex-col justify-center gap-1 px-2 z-[110] pointer-events-none">
        {reels.map((_, i) => (
          <div 
            key={i} 
            className={cn(
              "h-1.5 rounded-full transition-all duration-300",
              i === activeIndex ? "w-4 bg-white" : "w-1.5 bg-white/20"
            )} 
          />
        ))}
      </div>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
