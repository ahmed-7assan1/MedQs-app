"use client";
import { useScroll, useTransform, motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface BlurHeaderProps {
  title?: string;
  subtitle?: string;
  leftAction?: React.ReactNode;
  rightAction?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}

export function BlurHeader({ title, subtitle, leftAction, rightAction, className, children }: BlurHeaderProps) {
  const { scrollY } = useScroll();
  const bg = useTransform(scrollY, [0, 48], ["rgba(7,8,15,0)", "rgba(7,8,15,0.6)"]);
  const blur = useTransform(scrollY, [0, 48], ["blur(0px)", "blur(16px)"]);

  return (
    <motion.header
      style={{ backgroundColor: bg, backdropFilter: blur }}
      className={cn(
        "fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 h-14",
        "border-b border-white/[0.03]",
        className
      )}
    >
      <div className="flex items-center gap-3">
        {leftAction}
        <div>
          {title && <h1 className="text-sm font-black text-white">{title}</h1>}
          {subtitle && <p className="text-[9px] font-bold text-white/40 uppercase tracking-wider">{subtitle}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2">{rightAction}</div>
      {children}
    </motion.header>
  );
}
