"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ArrowRight, ArrowLeft, Info, RotateCw, XCircle, CheckCircle } from "lucide-react";

interface ReviewedCard {
  id: string;
  front: string;
  back: string;
  lectureTitle: string;
  subjectName: string;
  lastRating: number | null;
  repetitions: number;
  easeFactor: number;
  interval: number;
  lastReviewedAt: string | null;
  nextReviewAt: string;
  wrong: boolean;
  from?: string;
}

export function SpacedRepetitionCards() {
  const [cards, setCards] = useState<ReviewedCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => {
    fetch("/api/v1/flashcards/reviewed")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setCards(data);
        } else {
          setCards([]);
        }
      })
      .catch(() => { setCards([]); })
      .finally(() => setLoading(false));
  }, []);

  // Separate wrong cards for priority display
  const wrongCards = cards.filter((c) => c.wrong);
  const reviewCards = cards.filter((c) => !c.wrong);
  // Show wrong cards first
  const orderedCards = [...wrongCards, ...reviewCards];
  const isRandomCards = cards.length > 0 && cards.every((c) => c.from === "random");

  const current = orderedCards[currentIdx];
  const hasMultiple = orderedCards.length > 1;

  if (loading) {
    return (
      <div className="blog-card p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-4 w-4 rounded-full bg-white/10 animate-pulse" />
          <div className="h-3 w-24 rounded bg-white/10 animate-pulse" />
        </div>
        <div className="h-40 rounded-2xl bg-white/5 animate-pulse" />
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <Link href="/modules" className="block blog-card p-5 transition-all active:scale-[0.98]">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
            <RotateCw className="h-7 w-7 text-indigo-400/60" />
          </div>
          <div className="flex-1">
            <p className="text-[9px] font-black uppercase tracking-widest text-indigo-400/60">Spaced Repetition</p>
            <h3 className="text-sm font-black text-white">No flashcards yet</h3>
            <p className="text-xs font-medium text-white/40 mt-0.5">Browse modules to find study cards</p>
          </div>
          <ArrowRight className="h-5 w-5 text-white/30" />
        </div>
      </Link>
    );
  }

  return (
    <div className="blog-card p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <RotateCw className="h-4 w-4 text-indigo-400" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">
            {isRandomCards ? "Explore Flashcards" : "Spaced Repetition"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/modules`}
            className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest"
          >
            Study
          </Link>
          {wrongCards.length > 0 && (
            <span className="text-[9px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full">
              {wrongCards.length} wrong
            </span>
          )}
        </div>
      </div>

      {/* Card Flip Container */}
      <div className="relative">
        <motion.div
          key={currentIdx}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2 }}
        >
          <button
            onClick={() => setFlipped(!flipped)}
            className="w-full text-left focus:outline-none"
          >
            <motion.div
              animate={{ rotateY: flipped ? 180 : 0 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="relative w-full"
              style={{ transformStyle: "preserve-3d" }}
            >
              {/* Front */}
              <div
                className={cn(
                  "rounded-2xl p-5 min-h-[140px] flex flex-col",
                  flipped ? "hidden" : ""
                )}
                style={{ backfaceVisibility: "hidden" }}
              >
                <div className="flex items-center gap-2 mb-2">
                  {current.wrong && (
                    <XCircle className="h-4 w-4 text-rose-400 shrink-0" />
                  )}
                  <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest">
                    {current.from === "random" ? "Did you know?" : current.repetitions === 0 ? "Explore" : current.subjectName}
                  </span>
                </div>
                <p className="text-sm font-black text-white leading-relaxed flex-1">
                  {current.front}
                </p>
                <p className="text-[10px] text-white/20 mt-2">
                  Tap to reveal
                </p>
              </div>

              {/* Back */}
              <div
                className={cn(
                  "rounded-2xl p-5 min-h-[140px] flex flex-col",
                  !flipped ? "hidden" : ""
                )}
                style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
              >
                <div className="flex items-center gap-2 mb-2">
                  {current.wrong ? (
                    <XCircle className="h-4 w-4 text-rose-400 shrink-0" />
                  ) : (
                    <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
                  )}
                  <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest">
                    Answer
                  </span>
                </div>
                <p className="text-sm font-bold text-white leading-relaxed flex-1">
                  {current.back}
                </p>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-[10px] text-white/20">
                    {current.lectureTitle}
                  </p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowInfo(true);
                    }}
                    className="h-7 w-7 rounded-full bg-white/[0.06] flex items-center justify-center hover:bg-white/[0.12] transition-all active:scale-90"
                  >
                    <Info className="h-3.5 w-3.5 text-white/50" />
                  </button>
                </div>
              </div>
            </motion.div>
          </button>
        </motion.div>

        {/* Navigation arrows */}
        {hasMultiple && (
          <div className="flex items-center justify-between mt-3">
            <button
              onClick={() => {
                setCurrentIdx((prev) => (prev > 0 ? prev - 1 : orderedCards.length - 1));
                setFlipped(false);
              }}
              className="h-9 w-9 rounded-xl bg-muted/10 border border-muted/20 flex items-center justify-center active:scale-90 transition-all"
            >
              <ArrowLeft className="h-4 w-4 text-foreground/40" />
            </button>
            <span className="text-[10px] font-bold text-foreground/30">
              {currentIdx + 1} / {orderedCards.length}
            </span>
            <button
              onClick={() => {
                setCurrentIdx((prev) => (prev < orderedCards.length - 1 ? prev + 1 : 0));
                setFlipped(false);
              }}
              className="h-9 w-9 rounded-xl bg-muted/10 border border-muted/20 flex items-center justify-center active:scale-90 transition-all"
            >
              <ArrowRight className="h-4 w-4 text-white/40" />
            </button>
          </div>
        )}
      </div>

      {/* Info Modal */}
      {showInfo && current && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            onClick={() => setShowInfo(false)}
            className="fixed inset-0 z-[300] bg-black/50"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-4 bottom-24 z-[301] rounded-2xl bg-card border border-border/50 p-5 shadow-2xl"
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[9px] font-black uppercase tracking-widest text-indigo-400">Details</span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-white/40">Lecture</span>
                <span className="font-bold text-white text-right">{current.lectureTitle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">Subject</span>
                <span className="font-bold text-white">{current.subjectName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">Reviews</span>
                <span className="font-bold text-white">{current.repetitions}x</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">Status</span>
                <span className={cn("font-bold", current.repetitions === 0 ? "text-indigo-400" : current.wrong ? "text-rose-400" : "text-emerald-400")}>
                  {current.repetitions === 0 ? "New" : current.wrong ? "Needs Review" : "Learning"}
                </span>
              </div>
            </div>
            <button
              onClick={() => setShowInfo(false)}
              className="mt-4 w-full py-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 font-bold text-xs uppercase tracking-widest active:scale-[0.98] transition-all"
            >
              Got it
            </button>
          </motion.div>
        </>
      )}
    </div>
  );
}
