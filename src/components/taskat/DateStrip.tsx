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
                "date-pill flex-shrink-0",
                active && "active"
              )}
            >
              <span className={cn("text-[9px] font-bold uppercase tracking-widest", active ? "text-white/70" : "text-white/30")}>
                {dayName}
              </span>
              <span className={cn("text-lg font-bold", active ? "text-white" : "text-white/50")}>
                {dayNum}
              </span>
              {isToday && !active && (
                <div className="absolute bottom-2 h-1 w-1 rounded-full bg-primary" />
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
