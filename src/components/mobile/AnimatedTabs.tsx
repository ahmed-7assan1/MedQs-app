"use client";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

export function AnimatedTabs({
  tabs, active, onChange, className,
}: {
  tabs: Tab[];
  active: string;
  onChange: (id: string) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex gap-1 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-1", className)}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className="relative flex-1 py-2.5 text-[10px] font-black uppercase tracking-wider text-center transition-colors"
        >
          {active === tab.id && (
            <motion.div
              layoutId="animatedTabPill"
              className="absolute inset-0 rounded-xl bg-white/10 border border-white/[0.06] shadow-sm"
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
            />
          )}
          <span className={cn(
            "relative z-10 flex items-center justify-center gap-1.5",
            active === tab.id ? "text-white" : "text-white/40 hover:text-white/60"
          )}>
            {tab.icon}{tab.label}
          </span>
        </button>
      ))}
    </div>
  );
}
