"use client";

import React, { useEffect } from "react";
import { motion, useSpring, useTransform, useInView } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  GraduationCap, ShieldCheck, Flame, Play,
  Zap, Users, Mic, Search,
  BookOpen, BrainCircuit, Target,
  Sparkles, TrendingUp, TrendingDown, HelpCircle,
} from "lucide-react";
import Link from "next/link";

const iconRegistry: Record<string, React.ComponentType<{ className?: string }>> = {
  Target,
  Brain: BrainCircuit,
  ShieldCheck,
  GraduationCap,
  Flame,
  PlayCircle: Play,
  Zap,
  Users,
  Mic,
  Search,
  BookOpen,
};

const sizeMap: Record<number, string> = {
  12: "h-3 w-3",
  14: "h-3.5 w-3.5",
  16: "h-4 w-4",
  18: "h-[18px] w-[18px]",
  20: "h-5 w-5",
  24: "h-6 w-6",
  28: "h-7 w-7",
  32: "h-8 w-8",
};

const IconRenderer = ({ name, className, size = 20 }: { name: string, className?: string, size?: number }) => {
  const IconComponent = iconRegistry[name] || HelpCircle;
  const sizeClass = sizeMap[size] || "";
  return <IconComponent className={cn(sizeClass, className)} />;
};

interface StatCardProps {
  label: string;
  value: number | string;
  subtitle: string;
  iconName: string;
  color: string;
  trend?: "up" | "down";
  progress?: number;
  delay?: number;
}

export const StatCard = ({
  label, value, subtitle, iconName, color, trend = "up", progress, delay = 0
}: StatCardProps) => {
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true, margin: "200px" });
  const springValue = useSpring(0, { stiffness: 60, damping: 20 });
  const displayValue = useTransform(springValue, (v) => Math.floor(v).toLocaleString());

  useEffect(() => {
    if (isInView && typeof value === "number") {
      springValue.set(value);
    }
  }, [isInView, value, springValue]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 16 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.4, delay }}
      className="group relative flex flex-col justify-between p-4 md:p-5 rounded-2xl border border-border/40 bg-card/80 backdrop-blur-xl supports-[backdrop-filter]:bg-card/60 shadow-sm hover:shadow-md transition-all"
    >
      <div className="flex justify-between items-start">
        <div className={cn("p-2 rounded-xl bg-opacity-10", color)}>
          <IconRenderer name={iconName} className="h-4 w-4 md:h-5 md:w-5" />
        </div>
        {trend && (
          <div className={cn("flex items-center gap-1 text-[10px] font-bold", trend === "up" ? "text-emerald-500" : "text-rose-500")}>
            {trend === "up" ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {trend === "up" ? "+12%" : "-4%"}
          </div>
        )}
      </div>

      <div className="mt-3 md:mt-4">
        <p className="text-2xl md:text-3xl font-black tracking-tighter text-foreground">
          {typeof value === "number" ? <motion.span>{displayValue}</motion.span> : value}
          {label.includes("Mastery") || label.includes("Objective") ? "%" : ""}
        </p>
        <p className="mt-0.5 text-[11px] md:text-xs font-bold text-foreground/60 uppercase tracking-widest">{label}</p>
        <p className="mt-0.5 text-[10px] md:text-[11px] font-medium text-muted-foreground">{subtitle}</p>
      </div>

      {progress !== undefined && (
        <div className="mt-3 md:mt-4">
          <div className="h-1 w-full bg-slate-200 dark:bg-white/5 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={isInView ? { width: `${progress}%` } : {}}
              transition={{ duration: 1, delay: delay + 0.5 }}
              className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
            />
          </div>
        </div>
      )}
    </motion.div>
  );
};

export const StatCardMini = ({ label, value, iconName, color }: { label: string; value: string | number; iconName: string; color: string }) => {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-muted/50 hover:bg-muted transition-all">
      <div className={cn("p-1.5 rounded-lg", color.replace("text", "bg").replace("blue", "blue-500").replace("purple", "purple-500").replace("emerald", "emerald-500").replace("amber", "amber-500"))}>
        <IconRenderer name={iconName} size={14} className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-bold text-foreground/60 uppercase tracking-widest truncate">{label}</p>
        <p className="text-sm font-black text-foreground">{value}</p>
      </div>
    </div>
  );
};

export const EmptyState = ({ label, iconName, href }: any) => {
  return (
    <div className="flex flex-col items-center justify-center py-10 px-6 text-center">
      <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-muted-foreground mb-4">
        <IconRenderer name={iconName} size={28} />
      </div>
      <p className="text-sm font-bold text-foreground/60 mb-5">{label}</p>
      <Link
        href={href}
        className="px-5 py-2 rounded-xl bg-primary/10 text-primary text-xs font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all"
      >
        Start Learning
      </Link>
    </div>
  );
};

export const QuickActionCard = ({ label, iconName, color, href }: any) => {
  const iconColor = color?.replace("bg-", "text-").replace(" text-white", "");
  return (
    <Link
      href={href}
      className="group relative flex flex-col items-center gap-3 min-w-[90px] p-4 rounded-2xl border border-border/40 bg-card/80 backdrop-blur-xl supports-[backdrop-filter]:bg-card/60 shadow-sm transition-all duration-300 ease-out hover:-translate-y-1.5 hover:shadow-lg hover:border-primary/40"
    >
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-primary/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 pointer-events-none" />
      <IconRenderer name={iconName} size={22} className={cn("transition-all duration-300 group-hover:scale-110 group-hover:drop-shadow-[0_0_8px_var(--tw-shadow-color)]", iconColor)} />
      <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-foreground transition-colors duration-300">{label}</span>
    </Link>
  );
};

export const QuickLinkCompact = ({ label, iconName, color, href }: any) => {
  const shouldPrefetch = label === "Videos" || label === "Podcasts" || label === "Community";
  return (
    <Link
      href={href}
      prefetch={!shouldPrefetch}
      className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/40 hover:bg-muted border border-border/50 transition-all active:scale-95"
    >
      <div className={cn("p-1 rounded-lg", color)}>
        <IconRenderer name={iconName} size={12} className="text-white" />
      </div>
      <span className="text-[10px] font-bold text-foreground/70 truncate">{label}</span>
    </Link>
  );
};

export const AskDrQFeatured = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="group relative overflow-hidden rounded-2xl border border-border/40 bg-card/80 backdrop-blur-xl supports-[backdrop-filter]:bg-card/60 p-5 shadow-sm scanline"
    >
      <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-primary/20 blur-[60px]" />

      <div className="relative flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/30 rounded-xl blur-lg animate-glow-pulse" />
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white shadow">
              <Sparkles className="h-5 w-5" />
            </div>
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">Dr. Q AI</p>
            <h4 className="text-base font-black text-foreground">Ask anything</h4>
          </div>
        </div>

        <p className="text-xs font-medium text-foreground/60 leading-relaxed">
          Medical AI — clinical rationales, concept synthesis, instant answers.
        </p>

        <Link
          href="/ai-chat"
          className="h-10 flex items-center justify-center gap-2 rounded-xl bg-foreground text-background font-black text-[10px] uppercase tracking-[0.15em] shadow hover:scale-[1.02] active:scale-95 transition-all"
        >
          Open Dr. Q
        </Link>
      </div>
    </motion.div>
  );
};

export const AnimatedProgressBar = ({ progress, className }: { progress: number, className?: string }) => {
  return (
    <div className={cn("h-1.5 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden", className)}>
      <motion.div
        initial={{ width: 0 }}
        whileInView={{ width: `${progress}%` }}
        transition={{ duration: 1 }}
        className="h-full bg-gradient-to-r from-primary to-accent"
      />
    </div>
  );
};

export const AnimatedRing = ({ progress, size = 72, strokeWidth = 6, color = "text-primary" }: any) => {
  const radius = 50 - strokeWidth / 2;
  const circumference = 2 * Math.PI * radius;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="h-full w-full" viewBox="0 0 100 100">
        <circle className="text-slate-200 dark:text-white/5" strokeWidth={strokeWidth} stroke="currentColor" fill="transparent" r={radius} cx="50" cy="50" />
        <motion.circle
          className={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - (circumference * progress) / 100 }}
          transition={{ duration: 2 }}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius} cx="50" cy="50"
        />
      </svg>
    </div>
  );
};

export const ActivityBar = ({ height, delay, isToday }: any) => {
  return (
    <div className="w-full flex-1 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden relative">
      <motion.div
        initial={{ height: 0 }}
        animate={{ height: `${height}%` }}
        transition={{ duration: 0.8, delay }}
        className={cn("absolute bottom-0 left-0 right-0 rounded-full", isToday ? "bg-primary shadow-lg shadow-primary/30" : "bg-slate-300 dark:bg-white/20")}
      />
    </div>
  );
};
