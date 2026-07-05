"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import * as Icons from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";

/* ── 1. CONTINUE LEARNING CARD ── */
export const MobileContinueCard = ({ module, subject, progress, href }: any) => {
  return (
   <Card asChild className="shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group rounded-[24px]">
    <Link href={href || "/modules"}>
     <CardContent className="flex items-center justify-between p-5">
     
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
     </CardContent>
    </Link>
   </Card>
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
    <Card className="bg-card/40 shadow-sm rounded-[24px]">
      <CardContent className="p-5 space-y-4">
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
      </CardContent>
    </Card>
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
   <Card
    className="bg-white/[0.01] hover:bg-white/[0.02] transition-colors h-full relative overflow-hidden group rounded-[22px] border-b-2 hover:border-b-primary"
   >
    <CardContent className="flex flex-col items-center justify-center p-4">
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
    </CardContent>
   </Card>
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
   <Card className="bg-card/80 shadow-sm relative overflow-hidden rounded-[24px]">
    <CardContent className="p-5">
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
   </CardContent>
   </Card>
  );
};

/* ── LEGACY BACKWARD COMPATIBLE EXPORTS (for dashboard-app or other pages) ── */
export const MobileStatCard = ({ label, value, iconName, colorClass, progress, delay }: any) => {
  const Icon = (Icons as any)[iconName] || Icons.Circle;
  return (
   <Card className="bg-white/[0.02] snap-start">
    <CardContent className="p-4">
    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center mb-3 text-white", colorClass)}>
    <Icon size={18} />
   </div>
   <p className="text-[22px] font-black text-white leading-tight">{value}</p>
   <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider mt-1">{label}</p>
   <div className="mt-3 h-[3px] w-full bg-white/[0.04] rounded-full overflow-hidden">
    <div
     className={cn("h-full rounded-full", colorClass)}
    />
   </div>
   </CardContent>
   </Card>
  );
};

export const MobileBentoStatCard = ({ label, value, iconName, colorClass, progress, delay, colSpan = 1 }: any) => {
 const Icon = (Icons as any)[iconName] || Icons.Circle;
 const radius = 16;
 const circumference = 2 * Math.PI * radius;
 const strokeDashoffset = circumference - (progress / 100) * circumference;

 return (
  <Card
   className={cn(
    "bg-white/[0.02] relative overflow-hidden flex flex-col justify-between rounded-[24px]",
    colSpan === 2 ? "col-span-2" : "col-span-1"
   )}
  >
   <CardContent className="p-4">
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
   </CardContent>
  </Card>
 );
};

export const MobileQuickCard = ({ label, iconName, color, delay }: any) => {
 const Icon = (Icons as any)[iconName] || Icons.Circle;
 return (
   <Card className="bg-[#0c0d18]/60 rounded-2xl active:scale-[0.97] transition-transform">
    <CardContent className="flex flex-col items-center justify-center p-4">
    <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center mb-2.5", color)}>
    <Icon size={20} className="text-white" />
   </div>
    <span className="text-[10px] font-bold text-white/60 uppercase tracking-tight text-center">{label}</span>
   </CardContent>
   </Card>
  );
 };

export const MobileBentoQuickCard = ({ label, iconName, colorClass, delay, href }: any) => {
 const Icon = (Icons as any)[iconName] || Icons.Circle;
 return (
  <Card asChild className="rounded-[22px] bg-card/30 shadow-sm group overflow-hidden">
   <Link href={href || "#"}>
    <CardContent className="flex items-center justify-between p-4 relative">
    <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center mb-2.5 text-white transition-transform duration-300 group-hover:scale-110", colorClass)}>
     <Icon size={20} />
    </div>
    <span className="text-[9px] font-black text-white/50 group-hover:text-white uppercase tracking-widest text-center transition-colors">{label}</span>
    </CardContent>
   </Link>
  </Card>
 );
};

