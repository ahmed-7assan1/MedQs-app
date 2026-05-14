"use client";

import React, { useEffect, useState } from "react";
import { motion, useSpring, useTransform, useInView } from "framer-motion";
import { cn } from "@/lib/utils";
import * as Icons from "lucide-react";
import Link from "next/link";

/* ── ICON LOOKUP HELPER ── */
const IconRenderer = ({ name, className, size = 24 }: { name: string, className?: string, size?: number }) => {
  const IconComponent = (Icons as any)[name] || Icons.HelpCircle;
  return <IconComponent className={className} size={size} />;
};

/* ── 1. STAT CARD ── */
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
  const isInView = useInView(ref, { once: true });
  
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
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay }}
      className="group relative flex flex-col justify-between p-6 rounded-3xl border border-border bg-card hover:shadow-xl transition-all"
    >
      <div className="flex justify-between items-start">
        <div className={cn("p-3 rounded-2xl bg-opacity-10", color)}>
          <IconRenderer name={iconName} className="h-6 w-6" />
        </div>
        <div className={cn("flex items-center gap-1 text-xs font-bold", trend === "up" ? "text-emerald-500" : "text-rose-500")}>
          {trend === "up" ? <Icons.TrendingUp size={14} /> : <Icons.TrendingDown size={14} />}
          {trend === "up" ? "+12%" : "-4%"}
        </div>
      </div>
      
      <div className="mt-6">
        <p className="text-4xl font-black tracking-tighter text-foreground">
          {typeof value === "number" ? <motion.span>{displayValue}</motion.span> : value}
          {label.includes("Mastery") || label.includes("Objective") ? "%" : ""}
        </p>
        <p className="mt-1 text-sm font-bold text-foreground opacity-80 uppercase tracking-widest">{label}</p>
        <p className="mt-1 text-xs font-medium text-muted-foreground">{subtitle}</p>
      </div>

      {progress !== undefined && (
        <div className="mt-6">
          <div className="h-1.5 w-full bg-slate-200 dark:bg-white/5 rounded-full overflow-hidden">
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

/* ── 2. CONTINUE LEARNING HERO ── */
export const ContinueLearningHero = ({ module, progress, delay = 0 }: any) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay }}
      className="group relative overflow-hidden rounded-[2.5rem] border border-border bg-card p-8 shadow-xl"
    >
      <div className="absolute top-0 right-0 p-8 opacity-5 text-foreground">
        <Icons.BookOpen size={200} />
      </div>
      
      <div className="relative flex flex-col md:flex-row items-center gap-10">
        {/* Progress Ring */}
        <div className="relative h-32 w-32 shrink-0">
           <svg className="h-full w-full" viewBox="0 0 100 100">
             <circle className="text-slate-200 dark:text-white/5" strokeWidth="8" stroke="currentColor" fill="transparent" r="40" cx="50" cy="50" />
             <motion.circle
               className="text-primary"
               strokeWidth="8"
               strokeDasharray="251.2"
               initial={{ strokeDashoffset: 251.2 }}
               animate={{ strokeDashoffset: 251.2 - (251.2 * progress) / 100 }}
               transition={{ duration: 1.5, ease: "easeOut" }}
               strokeLinecap="round"
               stroke="currentColor"
               fill="transparent"
               r="40" cx="50" cy="50"
             />
           </svg>
           <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-black text-foreground">{progress}%</span>
           </div>
        </div>

        <div className="flex-1 min-w-0 text-center md:text-left">
           <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-2">Currently Studying</p>
           <h3 className="text-2xl md:text-4xl font-black text-foreground tracking-tight truncate">{module.title}</h3>
           <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest mt-1">{module.subject}</p>
        </div>

        <Link
          href={module.href}
          className="group/btn relative h-16 px-10 flex items-center justify-center gap-3 rounded-2xl bg-primary text-white font-black text-lg shadow-2xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all"
        >
          CONTINUE <Icons.ArrowRight className="h-5 w-5 group-hover/btn:translate-x-2 transition-transform" />
          <motion.div 
            animate={{ opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 bg-white/20 blur-xl -z-10"
          />
        </Link>
      </div>
    </motion.div>
  );
};

/* ── 3. EMPTY STATE ── */
export const EmptyState = ({ label, iconName, href }: any) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-muted-foreground mb-4">
        <IconRenderer name={iconName} size={32} />
      </div>
      <p className="text-sm font-bold text-foreground opacity-60 mb-6">{label}</p>
      <Link 
        href={href}
        className="px-6 py-2.5 rounded-xl bg-primary/10 text-primary text-xs font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all"
      >
        Start Learning
      </Link>
    </div>
  );
};

/* ── 4. QUICK ACTION CARD ── */
export const QuickActionCard = ({ label, iconName, color, href }: any) => {
  return (
    <Link
      href={href}
      className="group relative flex flex-col items-center gap-4 min-w-[120px] p-6 rounded-3xl border border-border bg-card transition-all hover:-translate-y-2 hover:shadow-2xl hover:shadow-primary/10 hover:border-primary/50"
    >
      <div className={cn("p-4 rounded-2xl transition-all group-hover:scale-110 shadow-lg", color)}>
        <IconRenderer name={iconName} size={24} className="text-white" />
      </div>
      <span className="text-[11px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-foreground transition-colors">{label}</span>
      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <Icons.ArrowRight size={14} className="text-primary" />
      </div>
    </Link>
  );
};

/* ── 5. ASK DR. Q FEATURED ── */
export const AskDrQFeatured = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="group relative overflow-hidden rounded-[2.5rem] border border-primary/20 bg-gradient-to-br from-primary/10 to-accent/5 p-8 shadow-2xl"
    >
      <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/20 blur-[80px]" />
      
      <div className="relative flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <div className="relative">
             <div className="absolute inset-0 bg-primary/40 rounded-2xl blur-xl animate-pulse" />
             <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-white shadow-xl">
                <Icons.Sparkles size={32} />
             </div>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Advanced AI</p>
            <h4 className="text-2xl font-black text-foreground">Ask Dr. Q</h4>
          </div>
        </div>
        
        <p className="text-sm font-medium text-foreground/70 leading-relaxed">
          Synthetic medical intelligence trained on your curriculum. Instant clinical rationales and deep conceptual synthesis.
        </p>
        
        <Link
          href="/ai-chat"
          className="h-14 flex items-center justify-center gap-3 rounded-2xl bg-foreground text-background font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:scale-105 active:scale-95 transition-all"
        >
          Initialize AI Session
        </Link>
      </div>
    </motion.div>
  );
};

/* ── 6. ANIMATED PROGRESS BAR ── */
export const AnimatedProgressBar = ({ progress, className }: { progress: number, className?: string }) => {
  return (
    <div className={cn("h-2 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden", className)}>
      <motion.div 
        initial={{ width: 0 }}
        whileInView={{ width: `${progress}%` }}
        transition={{ duration: 1 }}
        className="h-full bg-gradient-to-r from-primary to-accent"
      />
    </div>
  );
};

/* ── 7. ANIMATED RING ── */
export const AnimatedRing = ({ progress, size = 100, strokeWidth = 8, color = "text-primary" }: any) => {
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

/* ── 8. ACTIVITY BAR ── */
export const ActivityBar = ({ height, delay, isToday }: any) => {
  return (
    <div className="w-full flex-1 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden relative">
      <motion.div 
        initial={{ height: 0 }}
        animate={{ height: `${height}%` }}
        transition={{ duration: 1, delay }}
        className={cn("absolute bottom-0 left-0 right-0 rounded-full", isToday ? "bg-primary shadow-lg shadow-primary/40" : "bg-slate-300 dark:bg-white/20")}
      />
    </div>
  );
};
