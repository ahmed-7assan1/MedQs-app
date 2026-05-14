"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export function FadeIn({ children, delay = 0, className }: { children: React.ReactNode, delay?: number, className?: string }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), delay * 1000);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={className}
      style={{
        opacity: mounted ? 1 : 0,
        transform: mounted ? "translateY(0)" : "translateY(16px)",
        transition: `opacity 0.6s ease, transform 0.6s ease`,
      }}
    >
      {children}
    </div>
  );
}

export function AnimatedBar({ height, delay = 0, isToday = false }: { height: number, delay?: number, isToday?: boolean }) {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), delay * 1000 + 300);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      style={{
        height: animated ? `${height}%` : "0%",
        transition: `height 1.2s cubic-bezier(0.16, 1, 0.3, 1)`,
      }}
      className={`absolute bottom-0 w-full rounded-full ${
        isToday
          ? "bg-gradient-to-t from-[#6C5FF0] to-purple-400 shadow-[0_0_15px_rgba(108,95,240,0.5)]"
          : "bg-white/10"
      }`}
    />
  );
}
