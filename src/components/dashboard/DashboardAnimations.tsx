"use client";

import { motion } from "framer-motion";

export function FadeIn({ children, delay = 0 }: { children: React.ReactNode, delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay }}
    >
      {children}
    </motion.div>
  );
}

export function AnimatedBar({ height, delay = 0, isToday = false }: { height: number, delay?: number, isToday?: boolean }) {
  return (
    <motion.div
      initial={{ height: 0 }}
      animate={{ height: `${height}%` }}
      transition={{ duration: 1.5, ease: "easeOut", delay }}
      className={`absolute bottom-0 w-full rounded-full transition-all duration-500 ${
        isToday ? "bg-gradient-to-t from-[#6C5FF0] to-purple-400 shadow-[0_0_15px_rgba(108,95,240,0.5)]" : "bg-white/10"
      }`}
    />
  );
}
