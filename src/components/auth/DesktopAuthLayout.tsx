"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { LeftPanel } from "./LeftPanel";

const ease = [0.22, 1, 0.36, 1] as const;

export function DesktopAuthLayout({
  children,
  progressStep = 0,
}: {
  children: ReactNode;
  progressStep?: number;
}) {
  return (
    <div className="relative flex min-h-dvh bg-background dark:bg-gradient-to-b dark:from-[#090909] dark:to-[#111111]">
      {/* Left Panel — 55vw — flush with top and left edges */}
      <div className="min-h-dvh w-[55vw]">
        <LeftPanel currentStep={progressStep} />
      </div>

      {/* Right Section — 45vw — fade-up behind left panel */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease, delay: 0.3 }}
        className="flex min-h-dvh w-[45vw] items-center justify-center px-12"
      >
        <div className="w-full max-w-[420px]">
          {children}
        </div>
      </motion.div>
    </div>
  );
}
