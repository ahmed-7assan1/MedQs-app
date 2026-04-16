"use client";

import { useMemo, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface DateStripProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export function DateStrip({ selectedDate, onDateChange }: DateStripProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const days = useMemo(() => {
    const arr = [];
    const today = new Date();
    // Show 14 days starting from today - 1 (yesterday)
    for (let i = -1; i < 13; i++) {
        const d = new Date();
        d.setDate(today.getDate() + i);
        d.setHours(0, 0, 0, 0);
        arr.push(d);
    }
    return arr;
  }, []);

  const formatDate = (date: Date) => {
    const dayName = new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(date);
    const dayNum = date.getDate();
    return { dayName, dayNum };
  };

  const isSameDay = (d1: Date, d2: Date) => {
    return (
      d1.getDate() === d2.getDate() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getFullYear() === d2.getFullYear()
    );
  };

  // Auto-scroll to selected date on mount
  useEffect(() => {
    if (containerRef.current) {
        const selectedEl = containerRef.current.querySelector('[data-selected="true"]');
        if (selectedEl) {
            selectedEl.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
        }
    }
  }, []);

  return (
    <div className="relative">
      <div 
        ref={containerRef}
        className="flex gap-3 overflow-x-auto pb-4 scroll-smooth no-scrollbar"
        style={{ scrollSnapType: "x mandatory" }}
      >
        {days.map((date, i) => {
          const { dayName, dayNum } = formatDate(date);
          const active = isSameDay(date, selectedDate);
          const isToday = isSameDay(date, new Date());

          return (
            <button
              key={i}
              data-selected={active}
              onClick={() => onDateChange(date)}
              className={cn(
                "relative flex min-w-[70px] flex-col items-center justify-center rounded-3xl py-4 transition-all duration-300",
                "scroll-snap-align-center",
                active 
                  ? "bg-sky-500 text-white shadow-xl shadow-sky-500/30 scale-105" 
                  : "bg-white/40 dark:bg-white/5 dark:text-white/40 text-slate-400 hover:bg-white/60 dark:hover:bg-white/10"
              )}
            >
              <span className={cn("text-[10px] font-black uppercase tracking-widest", active ? "text-white/70" : "text-slate-400 dark:text-white/20")}>
                {dayName}
              </span>
              <span className="mt-1 text-2xl font-black font-display">
                {dayNum}
              </span>
              {isToday && !active && (
                <div className="absolute bottom-2 h-1 w-1 rounded-full bg-sky-500" />
              )}
            </button>
          );
        })}
      </div>
      
      {/* Fade Overlays */}
      <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-background to-transparent pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none" />
    </div>
  );
}
