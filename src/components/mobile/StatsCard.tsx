"use client";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ProgressRing } from "./ProgressRing";

interface StatsCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  progress?: number;
  color?: string;
  ring?: boolean;
  delay?: number;
  onClick?: () => void;
}

export function StatsCard({
  label, value, icon, progress, color = "text-primary", ring = false, delay = 0, onClick,
}: StatsCardProps) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={cn(
        "relative flex flex-col gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl p-4 text-left w-full",
        "hover:border-white/[0.12] transition-all duration-300"
      )}
    >
      <div className="flex items-center justify-between">
        {icon && (
          <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center border border-white/[0.06]", color)}>
            {icon}
          </div>
        )}
        {ring && progress !== undefined && (
          <ProgressRing progress={progress} size={36} strokeWidth={3}>
            <span className="text-[8px] font-black text-white">{Math.round(progress)}%</span>
          </ProgressRing>
        )}
      </div>
      <div>
        <p className="text-xl font-black text-white tracking-tight">{value}</p>
        <p className="text-[9px] font-bold text-white/40 uppercase tracking-wider mt-0.5">{label}</p>
      </div>
      {progress !== undefined && !ring && (
        <div className="h-1 w-full rounded-full bg-white/[0.06] overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, delay: delay + 0.2 }}
            className={cn("h-full rounded-full", color)}
          />
        </div>
      )}
      <div className="absolute top-0 right-0 p-4 opacity-[0.03] pointer-events-none">
        <div className={cn("h-20 w-20 rounded-full blur-3xl", color)} />
      </div>
    </motion.button>
  );
}
