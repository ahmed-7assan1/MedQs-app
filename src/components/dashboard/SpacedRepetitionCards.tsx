"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ArrowRightIcon, ArrowLeftIcon, InformationCircleIcon, ArrowPathIcon, XCircleIcon, CheckCircleIcon } from "@heroicons/react/24/solid";

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

  const fetchCards = (isRetry = false) => {
    if (!isRetry) setLoading(true);
    fetch("/api/v1/flashcards/reviewed")
      .then((r) => r.json())
      .then((data) => {
        setCards(Array.isArray(data) ? data : []);
      })
      .catch(() => { setCards([]); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchCards(); }, []);

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
      <div className="rounded-2xl border border-border/50 bg-card p-5 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-4 w-4 rounded-full bg-muted/30 animate-pulse" />
          <div className="h-3 w-24 rounded bg-muted/30 animate-pulse" />
        </div>
        <div className="h-40 rounded-2xl bg-muted/20 animate-pulse" />
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="rounded-2xl border border-border/50 bg-card p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ArrowPathIcon className="h-4 w-4 text-indigo-500" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
              Spaced Repetition
            </span>
          </div>
          <button onClick={() => fetchCards(true)} className="text-[9px] font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-widest">
            Refresh
          </button>
        </div>
        <Link href="/modules" className="block">
          <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/20 hover:bg-muted/30 transition-colors">
            <div className="h-14 w-14 rounded-2xl bg-indigo-100 dark:bg-indigo-500/10 flex items-center justify-center">
              <ArrowPathIcon className="h-7 w-7 text-indigo-500/60" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-black text-foreground">No flashcards yet</h3>
              <p className="text-xs font-medium text-muted-foreground mt-0.5">Browse modules to find study cards</p>
            </div>
            <ArrowRightIcon className="h-5 w-5 text-muted-foreground/40" />
          </div>
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border/50 bg-card p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <ArrowPathIcon className="h-4 w-4 text-indigo-500" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
            {isRandomCards ? "Explore Flashcards" : "Spaced Repetition"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchCards(true)}
            className="text-[9px] font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-widest"
          >
            Refresh
          </button>
          <Link
            href={`/modules`}
            className="text-[9px] font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-widest"
          >
            Study
          </Link>
          {wrongCards.length > 0 && (
            <span className="text-[9px] font-bold text-rose-500 bg-rose-100 dark:bg-rose-500/10 px-2 py-0.5 rounded-full">
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
                    <XCircleIcon className="h-4 w-4 text-rose-500 shrink-0" />
                  )}
                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                    {current.from === "random" ? "Did you know?" : current.repetitions === 0 ? "Explore" : current.subjectName}
                  </span>
                </div>
                <p className="text-sm font-black text-foreground leading-relaxed flex-1">
                  {current.front}
                </p>
                <p className="text-[10px] text-muted-foreground/50 mt-2">
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
                    <XCircleIcon className="h-4 w-4 text-rose-500 shrink-0" />
                  ) : (
                    <CheckCircleIcon className="h-4 w-4 text-emerald-500 shrink-0" />
                  )}
                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                    Answer
                  </span>
                </div>
                <p className="text-sm font-bold text-foreground leading-relaxed flex-1">
                  {current.back}
                </p>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-[10px] text-muted-foreground/50">
                    {current.lectureTitle}
                  </p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowInfo(true);
                    }}
                    className="h-7 w-7 rounded-full bg-muted/30 flex items-center justify-center hover:bg-muted/50 transition-all active:scale-90"
                  >
                    <InformationCircleIcon className="h-3.5 w-3.5 text-muted-foreground" />
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
              className="h-9 w-9 rounded-xl bg-muted/30 border border-border flex items-center justify-center active:scale-90 transition-all"
            >
              <ArrowLeftIcon className="h-4 w-4 text-muted-foreground" />
            </button>
            <span className="text-[10px] font-bold text-muted-foreground/60">
              {currentIdx + 1} / {orderedCards.length}
            </span>
            <button
              onClick={() => {
                setCurrentIdx((prev) => (prev < orderedCards.length - 1 ? prev + 1 : 0));
                setFlipped(false);
              }}
              className="h-9 w-9 rounded-xl bg-muted/30 border border-border flex items-center justify-center active:scale-90 transition-all"
            >
              <ArrowRightIcon className="h-4 w-4 text-muted-foreground" />
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
              <span className="text-[9px] font-black uppercase tracking-widest text-indigo-500">Details</span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Lecture</span>
                <span className="font-bold text-foreground text-right">{current.lectureTitle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subject</span>
                <span className="font-bold text-foreground">{current.subjectName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Reviews</span>
                <span className="font-bold text-foreground">{current.repetitions}x</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <span className={cn("font-bold", current.repetitions === 0 ? "text-indigo-500" : current.wrong ? "text-rose-500" : "text-emerald-500")}>
                  {current.repetitions === 0 ? "New" : current.wrong ? "Needs Review" : "Learning"}
                </span>
              </div>
            </div>
            <button
              onClick={() => setShowInfo(false)}
              className="mt-4 w-full py-2.5 rounded-xl bg-indigo-100 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold text-xs uppercase tracking-widest active:scale-[0.98] transition-all"
            >
              Got it
            </button>
          </motion.div>
        </>
      )}
    </div>
  );
}
