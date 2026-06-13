"use client";

import { useState, useEffect, useRef } from "react";
import { motion, animate } from "framer-motion";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  ArrowPathIcon, XMarkIcon, BookmarkIcon,
  CheckCircleIcon, XCircleIcon,
} from "@heroicons/react/24/solid";

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
  const [collapsed, setCollapsed] = useState(false);
  const [exiting, setExiting] = useState<string | null>(null);
  const [saved, setSaved] = useState<Set<string>>(new Set());

  const fetchCards = (isRetry = false) => {
    if (!isRetry) setLoading(true);
    fetch("/api/v1/flashcards/reviewed")
      .then((r) => r.json())
      .then((data) => {
        setCards(Array.isArray(data) ? data : []);
        setCurrentIdx(0);
        setFlipped(false);
      })
      .catch(() => { setCards([]); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchCards(); }, []);

  const wrongCards = cards.filter((c) => c.wrong);
  const reviewCards = cards.filter((c) => !c.wrong);
  const orderedCards = [...wrongCards, ...reviewCards];
  const isRandomCards = cards.length > 0 && cards.every((c) => c.from === "random");

  const current = orderedCards[currentIdx];
  const hasMultiple = orderedCards.length > 1;
  const remainingCards = orderedCards.slice(currentIdx + 1, currentIdx + 4);

  const handleRate = async (quality: "again" | "good") => {
    if (!current || exiting) return;
    const cardId = current.id;
    setExiting(cardId);
    try {
      await fetch(`/api/v1/flashcards/${cardId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quality }),
      });
    } catch { /* ignore */ }
    setTimeout(() => {
      setExiting(null);
      setFlipped(false);
      if (currentIdx < orderedCards.length - 1) {
        setCurrentIdx((p) => p + 1);
      } else {
        fetchCards(true);
      }
    }, 300);
  };

  const toggleSave = () => {
    if (!current) return;
    const id = current.id;
    setSaved((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const loadNext = () => {
    if (exiting) return;
    setFlipped(false);
    if (currentIdx < orderedCards.length - 1) {
      setCurrentIdx((p) => p + 1);
    } else {
      fetchCards(true);
    }
  };

  const loadPrev = () => {
    if (exiting) return;
    setFlipped(false);
    if (currentIdx > 0) setCurrentIdx((p) => p - 1);
  };

  const dismissAll = () => setCollapsed(true);

  // ─── MANUAL SWIPE ───
  const swipeRef = useRef<{ startX: number; currentX: number; el: HTMLDivElement | null }>({
    startX: 0, currentX: 0, el: null,
  });

  const handlePointerDown = (e: React.PointerEvent) => {
    const target = e.currentTarget as HTMLDivElement;
    target.setPointerCapture(e.pointerId);
    swipeRef.current = { startX: e.clientX, currentX: e.clientX, el: target };
    target.style.transition = "none";
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!swipeRef.current.el) return;
    const dx = e.clientX - swipeRef.current.startX;
    swipeRef.current.currentX = e.clientX;
    const rotate = Math.max(-12, Math.min(12, dx * 0.04));
    swipeRef.current.el.style.transform = `translateX(${dx}px) rotate(${rotate}deg)`;
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    const el = swipeRef.current.el;
    if (!el) return;
    const dx = e.clientX - swipeRef.current.startX;
    el.style.transition = "transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)";
    if (dx > 80) {
      el.style.transform = `translateX(500px) rotate(12deg)`;
      setTimeout(() => handleRate("good"), 180);
    } else if (dx < -80) {
      el.style.transform = `translateX(-500px) rotate(-12deg)`;
      setTimeout(() => handleRate("again"), 180);
    } else {
      el.style.transform = `translateX(0) rotate(0deg)`;
    }
    swipeRef.current = { startX: 0, currentX: 0, el: null };
  };

  if (loading) {
    return (
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="h-4 w-4 rounded-full bg-muted/30 animate-pulse" />
          <div className="h-3 w-24 rounded bg-muted/30 animate-pulse" />
        </div>
        <div className="h-[200px] rounded-2xl bg-muted/20 animate-pulse" />
      </div>
    );
  }

  if (collapsed) {
    return (
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ArrowPathIcon className="h-4 w-4 text-indigo-500" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
              Spaced Repetition
            </span>
          </div>
          <button onClick={() => setCollapsed(false)} className="text-[9px] font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-widest">
            Show
          </button>
        </div>
        <div className="h-[60px] rounded-2xl border border-dashed border-border bg-card/20 flex items-center justify-center">
          <p className="text-[11px] font-bold text-muted-foreground/50">Dismissed. Tap Show to reveal.</p>
        </div>
      </div>
    );
  }

  // ─── CARD STACK ───
  const CardStack = ({ currentId }: { currentId: string }) => (
    <div className="relative">
      {/* Cards behind */}
      {remainingCards.map((card, i) => (
        <div
          key={card.id}
          className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm overflow-hidden mb-1"
          style={{
            marginTop: i === 0 ? 0 : -8,
            transform: `scale(${1 - (i + 1) * 0.04})`,
            zIndex: -i - 1,
            opacity: 0.5 - i * 0.14,
            pointerEvents: "none",
          }}
        >
          <div className="p-4 min-h-[56px]">
            <p className="text-xs font-bold text-foreground/40 line-clamp-1">{card.front}</p>
          </div>
        </div>
      ))}

      {/* Current card */}
      <div style={{ marginTop: remainingCards.length > 0 ? -8 : 0, position: "relative", zIndex: 10 }}>
        {/* Floating save button */}
        <button
          onClick={toggleSave}
          className={cn(
            "absolute -top-2 -right-2 z-20 h-8 w-8 rounded-full flex items-center justify-center transition-all shadow-lg active:scale-90",
            saved.has(currentId)
              ? "bg-indigo-500 text-white shadow-indigo-500/30"
              : "bg-background border border-border text-muted-foreground/60 hover:text-indigo-500 hover:border-indigo-300"
          )}
        >
          <BookmarkIcon className={cn("h-4 w-4", saved.has(currentId) ? "fill-current" : "")} />
        </button>

        {/* Swipeable card */}
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          style={{ touchAction: "pan-y", cursor: "grab" }}
          className="select-none"
        >
          <div
            onClick={() => setFlipped((p) => !p)}
            className="w-full text-left focus:outline-none cursor-pointer"
          >
            <motion.div
              animate={{ rotateY: flipped ? 180 : 0 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              style={{ transformStyle: "preserve-3d" }}
            >
              {/* ─── FRONT ─── */}
              <div
                className={cn(
                  "rounded-2xl border border-border bg-card shadow-lg",
                  flipped ? "hidden" : ""
                )}
                style={{ backfaceVisibility: "hidden" }}
              >
                <div className="flex items-center justify-between px-4 pt-3 pb-1">
                  <div className="flex items-center gap-1.5">
                    {current.wrong && <XCircleIcon className="h-3.5 w-3.5 text-rose-500" />}
                    <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">
                      {current.from === "random" ? "Explore" : current.subjectName}
                    </span>
                  </div>
                  <span className="text-[9px] font-bold text-muted-foreground/40 tabular-nums">
                    {currentIdx + 1}/{orderedCards.length}
                  </span>
                </div>
                <div className="flex flex-col items-center justify-center px-5 py-4 text-center" style={{ minHeight: 100 }}>
                  <p className="text-sm font-black text-foreground leading-relaxed">
                    {current.front}
                  </p>
                  <p className="text-[9px] text-muted-foreground/40 mt-3">Tap to reveal</p>
                </div>
              </div>

              {/* ─── BACK ─── */}
              <div
                className={cn(
                  "rounded-2xl border border-border bg-card shadow-lg",
                  !flipped ? "hidden" : ""
                )}
                style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
              >
                <div className="flex items-center justify-between px-4 pt-3 pb-1">
                  <div className="flex items-center gap-1.5">
                    <CheckCircleIcon className="h-3.5 w-3.5 text-emerald-500" />
                    <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">Answer</span>
                  </div>
                  <span className="text-[9px] font-bold text-muted-foreground/40 tabular-nums">
                    {currentIdx + 1}/{orderedCards.length}
                  </span>
                </div>
                <div className="flex flex-col px-5 py-3" style={{ minHeight: 80 }}>
                  <p className="text-sm font-bold text-foreground leading-relaxed flex-1">
                    {current.back}
                  </p>
                  <p className="text-[9px] text-muted-foreground/40 mt-1">
                    {current.lectureTitle}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Rating buttons — shown after flip */}
        {flipped && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.15 }}
            className="flex gap-2 px-1 pt-3"
          >
            <button
              onClick={() => handleRate("again")}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-[0.97]",
                exiting === current.id
                  ? "bg-red-100 dark:bg-red-500/10 text-red-400"
                  : "bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-500/20"
              )}
            >
              <XCircleIcon className="h-4 w-4" />
              Got It Wrong
            </button>
            <button
              onClick={() => handleRate("good")}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-[0.97]",
                exiting === current.id
                  ? "bg-emerald-100 dark:bg-emerald-500/10 text-emerald-400"
                  : "bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-500/20"
              )}
            >
              <CheckCircleIcon className="h-4 w-4" />
              Got It
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );

  // ─── EMPTY STATE ───
  if (cards.length === 0) {
    return (
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ArrowPathIcon className="h-4 w-4 text-indigo-500" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
              Spaced Repetition
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => fetchCards(true)} className="text-[9px] font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-widest">
              Refresh
            </button>
            <button onClick={dismissAll} className="h-6 w-6 rounded-full hover:bg-muted/40 flex items-center justify-center text-muted-foreground/50 hover:text-muted-foreground transition-colors">
              <XMarkIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className="relative">
          <div onClick={() => setFlipped(!flipped)} className="w-full text-left focus:outline-none cursor-pointer">
            <motion.div
              animate={{ rotateY: flipped ? 180 : 0 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="relative w-full"
              style={{ transformStyle: "preserve-3d" }}
            >
              <div
                className={cn(
                  "rounded-2xl p-5 min-h-[160px] flex flex-col items-center justify-center text-center border border-border bg-card shadow-lg",
                  flipped ? "hidden" : ""
                )}
                style={{ backfaceVisibility: "hidden" }}
              >
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center mb-3 shadow-lg shadow-indigo-500/20">
                  <span className="text-white font-black text-lg">M</span>
                </div>
                <p className="text-xl font-black text-foreground tracking-tight">
                  Med<span className="text-indigo-500">Onex</span>
                </p>
                <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-[0.15em] mt-1">
                  Your AI Medical Companion
                </p>
                <p className="text-[10px] text-muted-foreground/40 mt-3">Tap to discover</p>
              </div>
              <div
                className={cn(
                  "rounded-2xl p-5 min-h-[160px] flex flex-col border border-border bg-card shadow-lg",
                  !flipped ? "hidden" : ""
                )}
                style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
              >
                <p className="text-xs font-bold text-foreground leading-relaxed flex-1">
                  MedOnex is an AI-powered medical education platform that helps students master medical knowledge through spaced repetition, interactive flashcards, and personalized learning paths.
                </p>
                <Link
                  href="/modules"
                  className="mt-3 inline-flex items-center justify-center gap-1.5 py-2 px-4 rounded-xl bg-indigo-500/10 text-indigo-500 font-bold text-[10px] uppercase tracking-widest active:scale-[0.97] transition-all"
                >
                  Start Learning
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <ArrowPathIcon className="h-4 w-4 text-indigo-500" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
            {isRandomCards ? "Explore Flashcards" : "Spaced Repetition"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {wrongCards.length > 0 && (
            <span className="text-[9px] font-bold text-rose-500 bg-rose-100 dark:bg-rose-500/10 px-2 py-0.5 rounded-full">
              {wrongCards.length} wrong
            </span>
          )}
          <button onClick={() => fetchCards(true)} className="text-[9px] font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-widest">
            Refresh
          </button>
          <button onClick={dismissAll} className="h-6 w-6 rounded-full hover:bg-muted/40 flex items-center justify-center text-muted-foreground/50 hover:text-muted-foreground transition-colors" title="Dismiss">
            <XMarkIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Card Stack */}
      {current && <CardStack currentId={current.id} />}

      {/* Bottom nav */}
      {hasMultiple && (
        <div className="flex items-center justify-between mt-3">
          <button
            onClick={loadPrev}
            disabled={currentIdx === 0}
            className={cn("h-8 w-8 rounded-xl flex items-center justify-center transition-all border", currentIdx > 0 ? "border-border bg-muted/30 active:scale-90" : "border-transparent text-muted-foreground/20")}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div className="flex gap-1.5">
            {orderedCards.map((_, i) => (
              <div
                key={i}
                className={cn("h-1.5 rounded-full transition-all", i === currentIdx ? "w-4 bg-indigo-500" : "w-1.5 bg-muted-foreground/20")}
              />
            ))}
          </div>
          <button
            onClick={loadNext}
            className="h-8 w-8 rounded-xl border border-border bg-muted/30 flex items-center justify-center active:scale-90 transition-all"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      )}
    </div>
  );
}
