"use client";

import React, { useState, useRef } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import * as Icons from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

/* ── 1. FLOATING HEADER (BACKGROUND BLENDS OVER THE PAGE) ── */
export const MobileTopBar = ({ userInitial, onMenuOpen }: { userInitial: string, onMenuOpen: () => void }) => {
  const { scrollY } = useScroll();
  
  // Transition background opacity from 0 to 0.5 (very soft blend) and blur from 0 to 12px
  const backgroundColor = useTransform(
    scrollY,
    [0, 48],
    ["rgba(7, 8, 15, 0)", "rgba(7, 8, 15, 0.4)"]
  );
  const backdropFilter = useTransform(scrollY, [0, 48], ["blur(0px)", "blur(12px)"]);

  return (
    <motion.header
      style={{ backgroundColor, backdropFilter }}
      className="fixed top-0 left-0 right-0 h-[56px] z-50 flex items-center justify-between px-4 md:hidden pointer-events-auto"
    >
      <div className="flex items-center gap-3">
        <button 
          onClick={onMenuOpen}
          className="h-9 w-9 rounded-full bg-white/[0.03] flex items-center justify-center text-white/80 active:scale-90 transition-transform"
        >
          <Icons.Menu size={18} />
        </button>
        <div className="flex items-center gap-1">
          <span className="text-[16px] font-black tracking-tighter text-white">MedOneX</span>
          <div className="h-1 w-1 rounded-full bg-primary" />
        </div>
      </div>
      
      <div className="flex items-center gap-2.5">
        <button aria-label="Search" className="h-9 w-9 rounded-full flex items-center justify-center text-white/70 active:scale-95">
          <Icons.Search size={18} />
        </button>
        <div className="relative">
          <button aria-label="Notifications" className="h-9 w-9 rounded-full flex items-center justify-center text-white/70 active:scale-95">
            <Icons.Bell size={18} />
          </button>
          <div className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-red-500" />
        </div>
        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-[#7b5fff] flex items-center justify-center text-white font-bold text-xs shadow-md shadow-primary/20 shrink-0">
          {userInitial}
        </div>
      </div>
    </motion.header>
  );
};

/* ── 2. MOBILE SIDEBAR (DRAWER) ── */
interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  user: { name: string; role: string; initial: string };
}

export const MobileSidebar = ({ isOpen, onClose, user }: SidebarProps) => {
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => setTouchStart(e.targetTouches[0].clientX);
  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const currentTouch = e.targetTouches[0].clientX;
    const diff = touchStart - currentTouch;
    if (diff > 80) {
      onClose();
      setTouchStart(null);
    }
  };

  const navSections = [
    {
      label: "Main",
      items: [
        { label: "Dashboard", icon: Icons.LayoutDashboard, href: "/dashboard-app", active: true },
        { label: "Lectures", icon: Icons.BookOpen, href: "/modules" },
        { label: "Tasks", icon: Icons.Flame, href: "/taskat" },
      ]
    },
    {
      label: "Practice",
      items: [
        { label: "Mock Exams", icon: Icons.HelpCircle, href: "/past-papers" },
      ]
    },
    {
      label: "Media",
      items: [
        { label: "OneX Videos", icon: Icons.PlayCircle, href: "/videos", badge: "New", badgeColor: "bg-[#00e5a0]" },
        { label: "Audio Lab", icon: Icons.Mic, href: "/podcasts" },
      ]
    }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 z-[120] backdrop-blur-sm"
          />

          <motion.div
            ref={sidebarRef}
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            className="fixed top-0 left-0 bottom-0 w-[280px] bg-[#0c0d18] z-[121] flex flex-col border-r border-white/[0.03] shadow-2xl overflow-hidden"
          >
            <div className="h-[56px] flex items-center justify-between px-4 border-b border-white/[0.03] shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="h-7 w-7 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
                  <Icons.Activity size={16} />
                </div>
                <span className="text-sm font-black text-white tracking-tight">MedOneX</span>
              </div>
              <button 
                onClick={onClose}
                className="h-8 w-8 rounded-full bg-white/[0.03] flex items-center justify-center text-white/60 active:scale-90 transition-transform"
              >
                <Icons.X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar py-3 px-3 space-y-5">
              {navSections.map((section, sIdx) => (
                <div key={section.label} className="space-y-1">
                  <p className="text-[9px] font-black uppercase tracking-wider text-white/20 px-2 mb-2">
                    {section.label}
                  </p>
                  {section.items.map((item: any, iIdx) => (
                    <Link key={item.label} href={item.href || "#"}>
                      <div
                        className={cn(
                          "relative flex items-center gap-3 p-2.5 rounded-xl transition-all cursor-pointer",
                          item.active ? "bg-primary/10 text-white" : "hover:bg-white/[0.02] text-white/40 hover:text-white"
                        )}
                      >
                        <div className={cn(
                          "h-7 w-7 rounded-lg flex items-center justify-center",
                          item.active ? "bg-primary/20 text-primary" : "bg-white/[0.02] text-white/30"
                        )}>
                          <item.icon size={15} />
                        </div>
                        <span className="text-xs font-bold">{item.label}</span>
                        {item.badge && (
                          <div className={cn("ml-auto px-1.5 py-0.5 rounded-md text-[8px] font-black text-white uppercase tracking-tighter", item.badgeColor)}>
                            {item.badge}
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              ))}
            </div>

            <div className="p-3 border-t border-white/[0.03] bg-[#080912] space-y-3 shrink-0">
              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.01]">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-[#7b5fff] flex items-center justify-center text-white font-bold text-xs">
                  {user.initial}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black text-white truncate">{user.name}</p>
                  <p className="text-[9px] font-bold text-white/30 uppercase truncate">{user.role}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button className="flex items-center justify-center gap-1.5 h-9 rounded-lg bg-white/[0.02] text-white/60 text-[11px] font-black border border-white/[0.03]">
                  <Icons.Settings size={12} /> Settings
                </button>
                <Link href="/api/auth/signout" className="flex items-center justify-center gap-1.5 h-9 rounded-lg bg-red-500/10 text-red-400 text-[11px] font-black border border-red-500/20">
                  <Icons.LogOut size={12} /> Sign Out
                </Link>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
export const MobileContinueCard = ({ module, subject, progress, href }: any) => {
  return (
    <Link href={href || "/modules"} className="block">
      <motion.div
        whileTap={{ scale: 0.98 }}
        className="flex items-center justify-between p-5 rounded-[24px] border border-border bg-card/60 shadow-sm hover:shadow-md  transition-all relative overflow-hidden group"
      >
        <div className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-primary to-violet-500" />
        
        <div className="flex-1 min-w-0 pl-2">
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 dark:text-white/30">Resume session</span>
          </div>
          <h3 className="text-[15px] font-extrabold text-slate-800 dark:text-white leading-tight truncate mb-1">{module}</h3>
          <p className="text-[10px] font-semibold text-slate-400 dark:text-white/40 truncate">{subject}</p>
        </div>

        <div className="flex items-center gap-3 shrink-0 ml-4">
          <div className="text-right">
            <span className="text-xs font-black text-primary">{progress}%</span>
            <p className="text-[8px] font-bold text-slate-400 dark:text-white/30 uppercase tracking-tighter">Done</p>
          </div>
          <div className="h-8 w-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:scale-105 transition-transform duration-200">
            <Icons.Play size={12} fill="currentColor" className="ml-0.5" />
          </div>
        </div>
      </motion.div>
    </Link>
  );
};

/* ── 4. LISTED STAT CARD SYSTEM (SLIM ROWS INSIDE A CONTAINER) ── */
interface MobileListedStatsProps {
  stats: {
    label: string;
    value: string;
    iconName: string;
    progress: number;
    color: string;
  }[];
}

export const MobileListedStats = ({ stats }: MobileListedStatsProps) => {
  return (
    <div className="rounded-[24px] border border-border bg-card/40 p-5 space-y-4 shadow-sm ">
      {stats.map((stat, idx) => {
        const Icon = (Icons as any)[stat.iconName] || Icons.Circle;
        return (
          <div key={idx} className="flex items-center justify-between gap-4">
            {/* Left side Icon */}
            <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center shrink-0 border border-slate-100 dark:border-white/[0.04] bg-slate-50 dark:bg-white/[0.02]", stat.color)}>
              <Icon size={16} />
            </div>

            {/* Middle Title & Progress bar */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[12px] font-extrabold text-slate-700 dark:text-white/80">{stat.label}</span>
                <span className="text-[10px] font-black text-slate-400 dark:text-white/40">{stat.value}</span>
              </div>
              <div className="h-1 w-full bg-slate-100 dark:bg-white/[0.04] rounded-full overflow-hidden">
                <div 
                  className={cn("h-full rounded-full bg-primary", stat.color.split(" ")[1] || "bg-primary")} 
                  style={{ width: `${stat.progress}%` }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

/* ── 5. COMPACT QUICK ACCESS (ICON-BASED HORIZONTAL BAR) ── */
interface QuickTool {
  label: string;
  iconName: string;
  href: string;
  color: string;
}

export const MobileCompactQuickAccess = ({ tools }: { tools: QuickTool[] }) => {
  return (
    <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar py-1">
      {tools.map((tool, idx) => {
        const Icon = (Icons as any)[tool.iconName] || Icons.Circle;
        return (
          <Link key={idx} href={tool.href} className="flex flex-col items-center gap-2 min-w-[58px] active:scale-90 transition-transform">
            <div className={cn(
              "h-11 w-11 rounded-full flex items-center justify-center border border-slate-200 dark:border-white/[0.03] bg-white dark:bg-white/5 shadow-sm",
              tool.color
            )}>
              <Icon size={18} />
            </div>
            <span className="text-[8px] font-black uppercase tracking-wider text-slate-400 dark:text-white/40 text-center whitespace-nowrap">
              {tool.label.split(" ")[0]}
            </span>
          </Link>
        );
      })}
    </div>
  );
};

/* ── 6. SPECIALIZATION CARD (SLIM LIST CARD) ── */
export const MobileSpecCard = ({ name, iconName, progress, delay }: any) => {
  const Icon = (Icons as any)[iconName] || Icons.Circle;
  
  const getColors = (icon: string) => {
    if (icon === "Brain") return { text: "text-violet-500 dark:text-violet-400", bg: "bg-violet-50 dark:bg-violet-500/10", border: "from-violet-500 to-purple-400" };
    if (icon === "Activity" || icon === "Heart") return { text: "text-rose-500 dark:text-rose-400", bg: "bg-rose-50 dark:bg-rose-500/10", border: "from-rose-500 to-pink-400" };
    return { text: "text-blue-500 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-500/10", border: "from-blue-500 to-cyan-400" };
  };
  const theme = getColors(iconName);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className="flex items-center justify-between p-4 rounded-[22px] border border-border bg-card/30 mb-2.5 relative overflow-hidden group shadow-sm "
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className={cn("w-8.5 h-8.5 rounded-xl flex items-center justify-center shrink-0 border border-slate-100 dark:border-white/[0.02]", theme.bg)}>
          <Icon size={16} className={theme.text} />
        </div>
        <div className="flex-1 min-w-0 pr-4">
          <p className="text-[13px] font-extrabold text-slate-800 dark:text-white truncate mb-1">{name}</p>
          <div className="h-[3px] w-full bg-slate-100 dark:bg-white/[0.04] rounded-full overflow-hidden">
            <div 
              className={cn("h-full bg-gradient-to-r rounded-full", theme.border)} 
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
      <span className="text-[10px] font-black text-slate-400 dark:text-white/30 shrink-0">{progress}%</span>
    </motion.div>
  );
};

/* ── 7. ASK DR. Q CARD (COMPACT SEARCH INPUT) ── */
export const MobileDrQCard = () => {
  const router = useRouter();
  const [question, setQuestion] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;
    router.push(`/ai-chat?q=${encodeURIComponent(question.trim())}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="rounded-[24px] border border-border bg-card/80 p-5 shadow-sm relative overflow-hidden"
    >
      <div className="flex items-center gap-2.5 mb-3.5">
        <div className="h-8 w-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
          <Icons.Sparkles size={15} className="text-primary animate-pulse" />
        </div>
        <div>
          <h4 className="text-xs font-black text-slate-800 dark:text-white leading-none">Consult Dr. Q</h4>
          <p className="text-[8px] font-bold text-slate-400 dark:text-white/30 uppercase tracking-widest mt-0.5">Instant Syllabus Answers</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Consult about Action Potential, Mitosis..."
          className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-white/25 text-[11px] focus:outline-none focus:border-primary/50 transition-colors"
        />
        <button 
          type="submit"
          className="h-9 w-9 bg-primary hover:bg-[#684be3] rounded-xl text-white flex items-center justify-center shadow-md shadow-primary/20 shrink-0"
        >
          <Icons.Send size={12} className="text-white" />
        </button>
      </form>
    </motion.div>
  );
};

/* ── LEGACY BACKWARD COMPATIBLE EXPORTS (for dashboard-app or other pages) ── */
export const MobileStatCard = ({ label, value, iconName, colorClass, progress, delay }: any) => {
  const Icon = (Icons as any)[iconName] || Icons.Circle;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="min-w-[130px] p-4 rounded-2xl border border-white/[0.04] bg-white/[0.02] snap-start"
    >
      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center mb-3 text-white", colorClass)}>
        <Icon size={18} />
      </div>
      <p className="text-[22px] font-black text-white leading-tight">{value}</p>
      <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider mt-1">{label}</p>
      <div className="mt-3 h-[3px] w-full bg-white/[0.04] rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          className={cn("h-full rounded-full", colorClass)} 
        />
      </div>
    </motion.div>
  );
};

export const MobileBentoStatCard = ({ label, value, iconName, colorClass, progress, delay, colSpan = 1 }: any) => {
  const Icon = (Icons as any)[iconName] || Icons.Circle;
  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay }}
      className={cn(
        "p-4 rounded-[24px] border border-white/[0.04] bg-white/[0.02] backdrop-blur-xl relative overflow-hidden flex flex-col justify-between",
        colSpan === 2 ? "col-span-2" : "col-span-1"
      )}
    >
      <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
        <div className={cn("h-16 w-16 rounded-full blur-2xl", colorClass)} />
      </div>
      <div className="flex items-center justify-between mb-4">
        <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center bg-white/[0.04] border border-white/[0.06]", colorClass)}>
          <Icon size={16} className="text-white" />
        </div>
        <div className="relative h-9 w-9 flex items-center justify-center shrink-0">
          <svg className="w-full h-full transform -rotate-90">
            <circle className="text-white/[0.03]" strokeWidth="2.5" stroke="currentColor" fill="transparent" r={radius} cx="18" cy="18" />
            <motion.circle
              className="text-primary"
              strokeWidth="2.5"
              stroke="currentColor"
              fill="transparent"
              r={radius}
              cx="18"
              cy="18"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1, delay: delay + 0.1, ease: "easeOut" }}
            />
          </svg>
          <span className="absolute text-[8px] font-black text-white">{progress}%</span>
        </div>
      </div>
      <div>
        <p className="text-[20px] font-black text-white leading-tight tracking-tight mb-0.5">{value}</p>
        <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{label}</p>
      </div>
    </motion.div>
  );
};

export const MobileQuickCard = ({ label, iconName, color, delay }: any) => {
  const Icon = (Icons as any)[iconName] || Icons.Circle;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="flex flex-col items-center justify-center p-4 rounded-2xl border border-white/[0.04] bg-[#0c0d18]/60 active:scale-[0.97] transition-transform"
    >
      <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center mb-2.5", color)}>
        <Icon size={20} className="text-white" />
      </div>
      <span className="text-[10px] font-bold text-white/60 uppercase tracking-tight text-center">{label}</span>
    </motion.div>
  );
};

export const MobileBentoQuickCard = ({ label, iconName, colorClass, delay, href }: any) => {
  const Icon = (Icons as any)[iconName] || Icons.Circle;
  return (
    <Link href={href || "#"} className="block h-full">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay }}
        whileTap={{ scale: 0.95 }}
        className="flex flex-col items-center justify-center p-4 rounded-[22px] border border-white/[0.04] bg-white/[0.01] backdrop-blur-md hover:bg-white/[0.02] transition-all h-full relative overflow-hidden group border-b-2 hover:border-b-primary"
      >
        <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center mb-2.5 text-white transition-transform duration-300 group-hover:scale-110", colorClass)}>
          <Icon size={20} />
        </div>
        <span className="text-[9px] font-black text-white/50 group-hover:text-white uppercase tracking-widest text-center transition-colors">{label}</span>
      </motion.div>
    </Link>
  );
};

