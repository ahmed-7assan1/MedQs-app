"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ProgressRing } from "./ProgressRing";

interface SubjectCardProps {
  name: string;
  icon?: React.ReactNode;
  progress: number;
  color?: string;
  gradient?: string;
  href: string;
  moduleCount?: number;
  delay?: number;
}

export function SubjectCard({
  name, icon, progress, color = "text-primary", gradient = "from-primary/20 to-transparent",
  href, moduleCount, delay = 0,
}: SubjectCardProps) {
  return (
    <Link href={href}>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay }}
        whileTap={{ scale: 0.97 }}
        className={cn(
          "group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5",
          "hover:border-white/[0.12] transition-all duration-300"
        )}
      >
        <div className={cn("absolute inset-0 bg-gradient-to-br opacity-30", gradient)} />
        <div className="relative flex items-start justify-between">
          <div className="flex items-center gap-3">
            {icon && (
              <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center border border-white/[0.06]", color)}>
                {icon}
              </div>
            )}
            <div>
              <h3 className="text-sm font-black text-white leading-tight">{name}</h3>
              {moduleCount !== undefined && (
                <p className="text-[10px] font-bold text-white/40 mt-0.5">{moduleCount} modules</p>
              )}
            </div>
          </div>
          <ProgressRing progress={progress} size={40} strokeWidth={3}>
            <span className="text-[9px] font-black text-white">{Math.round(progress)}%</span>
          </ProgressRing>
        </div>
      </motion.div>
    </Link>
  );
}
