"use client";

import React, { useEffect, useState, useRef } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import * as Icons from "lucide-react";
import Link from "next/link";

/* ── 1. STICKY TOP BAR ── */
export const MobileTopBar = ({ userInitial, onMenuOpen }: { userInitial: string, onMenuOpen: () => void }) => {
  const { scrollY } = useScroll();
  const backgroundColor = useTransform(
    scrollY,
    [0, 50],
    ["rgba(7, 8, 15, 0)", "rgba(7, 8, 15, 0.8)"]
  );
  const backdropFilter = useTransform(scrollY, [0, 50], ["blur(0px)", "blur(12px)"]);

  return (
    <motion.header
      style={{ backgroundColor, backdropFilter }}
      className="fixed top-0 left-0 right-0 h-[56px] z-50 flex items-center justify-between px-4 border-b border-white/5 md:hidden"
    >
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuOpen}
          className="h-9 w-9 rounded-full bg-white/5 flex items-center justify-center text-white active:scale-90 transition-transform"
        >
          <Icons.Menu size={20} />
        </button>
        <div className="flex items-center gap-1.5">
          <span className="text-lg font-black tracking-tighter text-white">MedOneX</span>
          <div className="h-1.5 w-1.5 rounded-full bg-[#4f5fff]" />
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <Icons.Search size={20} className="text-white/80" />
        <div className="relative">
           <Icons.Bell size={20} className="text-white/80" />
           <div className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500 border border-[#07080f]" />
        </div>
        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#4f5fff] to-[#7b5fff] flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-primary/20">
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
    if (diff > 80) { // Swipe left 80px
      onClose();
      setTouchStart(null);
    }
  };

  const navSections = [
    {
      label: "Main",
      items: [
        { label: "Dashboard", icon: Icons.LayoutDashboard, active: true },
        { label: "Lectures", icon: Icons.Book },
        { label: "Study Tools", icon: Icons.Wrench },
      ]
    },
    {
      label: "Practice",
      items: [
        { label: "Quizzes", icon: Icons.HelpCircle, badge: "12", badgeColor: "bg-[#4f5fff]" },
      ]
    },
    {
      label: "Media",
      items: [
        { label: "OneX Videos", icon: Icons.Video, badge: "New", badgeColor: "bg-[#00e5a0]" },
        { label: "Reels", icon: Icons.Play },
      ]
    },
    {
      label: "Community",
      items: [
        { label: "Podcasts", icon: Icons.Mic },
        { label: "Community", icon: Icons.Users },
      ]
    }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black z-[49] backdrop-blur-sm"
          />

          {/* Sidebar */}
          <motion.div
            ref={sidebarRef}
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            className="fixed top-0 left-0 bottom-0 w-[300px] bg-[#0f1120] z-[50] flex flex-col border-r border-[#1f2240] shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="h-[56px] flex items-center justify-between px-[18px] border-b border-[#1f2240] shrink-0">
               <div className="flex items-center gap-3">
                  <div className="h-7 w-7 rounded-lg bg-[#4f5fff] flex items-center justify-center text-white">
                     <Icons.Activity size={18} />
                  </div>
                  <span className="text-[15px] font-bold text-white tracking-tight">MedOneX</span>
               </div>
               <button 
                 onClick={onClose}
                 className="h-8 w-8 rounded-full bg-[#181a2e] flex items-center justify-center text-[#8b8fa8] active:scale-90 transition-transform"
               >
                 <Icons.X size={18} />
               </button>
            </div>

            {/* Nav Body */}
            <div className="flex-1 overflow-y-auto no-scrollbar py-3 px-3 space-y-6">
               {navSections.map((section, sIdx) => (
                 <div key={section.label} className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#3d3f5c] px-2 mb-2">
                      {section.label}
                    </p>
                    {section.items.map((item: any, iIdx) => (
                      <motion.div
                        key={item.label}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 + (sIdx * 0.05) + (iIdx * 0.03) }}
                        className={cn(
                          "relative group flex items-center gap-3 p-2.5 rounded-xl transition-all cursor-pointer",
                          item.active ? "bg-[#4f5fff]/10" : "hover:bg-[#181a2e]"
                        )}
                      >
                        {item.active && (
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: 3 }}
                            className="absolute left-0 top-[20%] bottom-[20%] bg-[#4f5fff] rounded-r-full"
                          />
                        )}
                        <div className={cn(
                          "h-8 w-8 rounded-lg flex items-center justify-center transition-colors",
                          item.active ? "bg-[#4f5fff]/20 text-[#4f5fff]" : "bg-[#181a2e] text-[#8b8fa8] group-hover:text-white"
                        )}>
                          <item.icon size={16} />
                        </div>
                        <span className={cn(
                          "text-[13px] font-medium transition-colors",
                          item.active ? "text-white" : "text-[#8b8fa8] group-hover:text-white"
                        )}>
                          {item.label}
                        </span>
                        {item.badge && (
                          <div className={cn("ml-auto px-2 py-0.5 rounded-full text-[9px] font-black text-white uppercase tracking-tighter", item.badgeColor)}>
                            {item.badge}
                          </div>
                        )}
                      </motion.div>
                    ))}
                    {sIdx < navSections.length - 1 && <div className="h-[1px] bg-[#1f2240] mx-2 mt-4" />}
                 </div>
               ))}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-[#1f2240] bg-[#0f1120] space-y-3 shrink-0">
               {/* User Card */}
               <div className="flex items-center gap-3 p-3 rounded-xl border border-[#1f2240] bg-[#181a2e]">
                  <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#4f5fff] to-[#7b5fff] flex items-center justify-center text-white font-bold text-sm">
                    {user.initial}
                  </div>
                  <div className="flex-1 min-w-0">
                     <p className="text-[13px] font-bold text-white truncate">{user.name}</p>
                     <p className="text-[11px] font-medium text-[#8b8fa8] uppercase tracking-wider">{user.role}</p>
                  </div>
                  <button className="h-7 w-7 rounded-lg bg-[#07080f] border border-[#1f2240] flex items-center justify-center text-[#8b8fa8]">
                    <Icons.MoreVertical size={14} />
                  </button>
               </div>

               {/* Action Row */}
               <div className="grid grid-cols-2 gap-2">
                  <button className="flex items-center justify-center gap-2 h-10 rounded-xl bg-[#181a2e] text-[#8b8fa8] text-[12px] font-bold border border-transparent hover:border-[#4f5fff]/30 transition-all">
                    <Icons.Settings size={14} /> Settings
                  </button>
                  <button className="flex items-center justify-center gap-2 h-10 rounded-xl bg-[#ff4d6a]/10 text-[#ff4d6a] text-[12px] font-bold border border-[#ff4d6a]/20">
                    <Icons.LogOut size={14} /> Sign Out
                  </button>
               </div>

               {/* Fullscreen */}
               <button className="w-full flex items-center justify-center gap-2 h-10 rounded-xl bg-[#07080f] border border-[#1f2240] text-[#8b8fa8] text-[12px] font-bold">
                 <Icons.Maximize size={14} /> Fullscreen Mode
               </button>

               <p className="text-[10px] text-[#3d3f5c] text-center font-bold tracking-tight py-1">
                 MedOneX · Medical Education Platform
               </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

/* ── 3. BOTTOM NAVIGATION ── */
export const MobileBottomNav = () => {
  const navItems = [
    { label: "Home", icon: Icons.Home, active: true },
    { label: "Library", icon: Icons.Layers },
    { label: "Schedule", icon: Icons.Clock },
    { label: "Practice", icon: Icons.Zap },
    { label: "Ask Dr.Q", icon: Icons.Sparkles },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-[64px] bg-[#0f1120] border-t border-[#1f2240] z-40 flex items-center justify-around pb-[env(safe-area-inset-bottom)] md:hidden">
      {navItems.map((item, i) => (
        <div key={i} className="flex flex-col items-center gap-1 relative px-2">
          {item.active && (
            <motion.div 
              layoutId="activeNav"
              className="absolute -top-[18px] w-5 h-[2px] bg-[#4f5fff]" 
            />
          )}
          <item.icon size={22} className={cn(item.active ? "text-[#4f5fff]" : "text-[#3d3f5c]")} />
          <span className={cn("text-[9px] font-medium uppercase tracking-wider", item.active ? "text-[#4f5fff]" : "text-[#3d3f5c]")}>
            {item.label}
          </span>
        </div>
      ))}
    </nav>
  );
};

/* ── 4. CONTINUE LEARNING CARD ── */
export const MobileContinueCard = ({ module, subject, progress }: any) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative overflow-hidden rounded-2xl border border-[#3a3f6a] bg-gradient-to-br from-[#151830] to-[#1e1545] p-5 shadow-2xl"
    >
      <div className="absolute top-0 right-0 p-4 opacity-10">
         <div className="h-24 w-24 rounded-full bg-[#4f5fff] blur-3xl" />
      </div>

      <div className="flex items-center gap-1.5 mb-3">
        <div className="h-1.5 w-1.5 rounded-full bg-[#4f5fff]" />
        <span className="text-[10px] font-black uppercase tracking-[0.1em] text-[#4f5fff]">Persistence Phase</span>
      </div>

      <h3 className="text-2xl font-bold text-white mb-1">{module}</h3>
      <p className="text-xs font-medium text-[#8b8fa8] mb-5">{subject}</p>

      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 h-[5px] bg-white/10 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-[#4f5fff] to-[#00d4ff] rounded-full"
          />
        </div>
        <span className="text-[10px] font-bold text-white/60">{progress}%</span>
      </div>

      <button className="w-full h-12 flex items-center justify-center gap-2 bg-[#4f5fff] rounded-xl text-white font-bold transition-transform active:scale-[0.97] shadow-lg shadow-[#4f5fff]/20">
        Continue <Icons.Play size={14} fill="currentColor" />
      </button>
    </motion.div>
  );
};

/* ── 5. STAT CARD ── */
export const MobileStatCard = ({ label, value, iconName, colorClass, progress, delay }: any) => {
  const Icon = (Icons as any)[iconName] || Icons.Circle;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="min-w-[130px] p-4 rounded-2xl border border-[#1f2240] bg-[#0f1120] snap-start"
    >
      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center mb-3", colorClass)}>
        <Icon size={18} className="text-white" />
      </div>
      <p className="text-[22px] font-bold text-white leading-tight">{value}</p>
      <p className="text-[10px] font-medium text-[#8b8fa8] uppercase tracking-wider mt-1">{label}</p>
      <div className="mt-3 h-[3px] w-full bg-white/5 rounded-full overflow-hidden">
         <motion.div 
           initial={{ width: 0 }}
           animate={{ width: `${progress}%` }}
           transition={{ duration: 0.8, delay: delay + 0.2 }}
           className={cn("h-full rounded-full", colorClass)} 
         />
      </div>
    </motion.div>
  );
};

/* ── 6. QUICK ACCESS CARD ── */
export const MobileQuickCard = ({ label, iconName, color, delay }: any) => {
  const Icon = (Icons as any)[iconName] || Icons.Circle;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="flex flex-col items-center justify-center p-4 rounded-2xl border border-[#1f2240] bg-[#0f1120] active:scale-[0.97] transition-transform"
    >
      <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center mb-2.5", color)}>
        <Icon size={20} className="text-white" />
      </div>
      <span className="text-[10px] font-bold text-[#8b8fa8] uppercase tracking-tight text-center">{label}</span>
    </motion.div>
  );
};

/* ── 7. SPECIALIZATION CARD ── */
export const MobileSpecCard = ({ name, iconName, progress, delay }: any) => {
  const Icon = (Icons as any)[iconName] || Icons.Circle;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="flex items-center gap-4 p-4 rounded-2xl border border-[#1f2240] bg-[#0f1120] mb-2"
    >
      <div className="w-10 h-10 rounded-xl bg-[#4f5fff]/10 flex items-center justify-center shrink-0">
        <Icon size={20} className="text-[#4f5fff]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-semibold text-white truncate">{name}</p>
        <div className="mt-2 h-1 w-full bg-white/5 rounded-full overflow-hidden">
           <motion.div 
             initial={{ width: 0 }}
             animate={{ width: `${progress}%` }}
             transition={{ duration: 0.8 }}
             className="h-full bg-gradient-to-r from-[#4f5fff] to-[#7b5fff] rounded-full" 
           />
        </div>
      </div>
      <span className="text-[11px] font-bold text-[#8b8fa8] ml-2">{progress}%</span>
    </motion.div>
  );
};

/* ── 8. ASK DR. Q CARD ── */
export const MobileDrQCard = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="relative overflow-hidden rounded-2xl border border-[#3a3f7a] bg-gradient-to-br from-[#111530] to-[#1a1060] p-5 shadow-2xl"
    >
      <div className="flex items-start gap-4 mb-4">
        <div className="relative shrink-0">
           <div className="absolute inset-0 rounded-xl bg-[#7b5fff]/20 blur-md animate-pulse" />
           <div className="relative w-11 h-11 rounded-xl bg-[#7b5fff]/10 border border-[#7b5fff]/40 flex items-center justify-center">
              <Icons.Sparkles size={24} className="text-[#7b5fff]" />
           </div>
        </div>
        <div>
           <p className="text-[10px] font-bold text-[#7b5fff] uppercase tracking-[0.2em] mb-0.5">Sentinel AI</p>
           <h4 className="text-[16px] font-bold text-white leading-tight">Ask Dr. Q</h4>
        </div>
      </div>
      
      <p className="text-[12px] text-[#8b8fa8] leading-relaxed mb-6">
        Synthetic medical intelligence trained on your curriculum. Instant clinical rationales.
      </p>
      
      <button className="w-full h-11 flex items-center justify-center gap-2 border border-[#7b5fff] rounded-xl text-[#7b5fff] font-bold text-xs uppercase tracking-widest active:scale-[0.97] transition-all">
        <Icons.Sparkles size={14} /> Initialize Session
      </button>
    </motion.div>
  );
};
