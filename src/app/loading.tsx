"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { 
  Stethoscope, BookOpen, Video, Mic2, 
  MessageSquare, LayoutDashboard, Sparkles, 
  Activity, HelpCircle, Settings, User
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const LOADING_CONFIG: Record<string, { icon: any; text: string; color: string }> = {
  "/dashboard": { icon: LayoutDashboard, text: "Preparing your dashboard", color: "text-blue-500" },
  "/modules": { icon: BookOpen, text: "Loading curriculum", color: "text-indigo-500" },
  "/videos": { icon: Video, text: "Opening Video Hub", color: "text-red-500" },
  "/podcasts": { icon: Mic2, text: "Tuning into Audio Hub", color: "text-green-500" },
  "/forum": { icon: MessageSquare, text: "Joining the community", color: "text-pink-500" },
  "/ai-chat": { icon: Sparkles, text: "Connecting to Dr. Q", color: "text-amber-500" },
  "/past-papers": { icon: HelpCircle, text: "Fetching questions", color: "text-purple-500" },
  "/settings": { icon: Settings, text: "Loading preferences", color: "text-slate-500" },
  "/profile": { icon: User, text: "Opening your profile", color: "text-sky-500" },
  "default": { icon: Stethoscope, text: "MedQs is preparing", color: "text-primary" }
};

export default function GlobalLoading() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Find matching config or use default
  const configKey = Object.keys(LOADING_CONFIG).find(key => pathname?.startsWith(key)) || "default";
  const { icon: Icon, text, color } = LOADING_CONFIG[configKey];

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background transition-colors duration-1000">
      <div className="relative flex flex-col items-center">
        {/* Subtle Ambient Glow */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.05 }}
          className={cn("absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0 blur-[120px] rounded-full", color.replace("text-", "bg-"))}
          style={{ width: '400px', height: '400px' }}
        />
        
        {/* Main Animated Icon */}
        <div className="relative z-10">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ 
              type: "spring",
              stiffness: 260,
              damping: 20 
            }}
            className={cn("relative p-6 rounded-[32px] bg-white/[0.02] border border-white/5 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.4)]", color)}
          >
            <Icon size={48} strokeWidth={1.5} className="animate-pulse" />
          </motion.div>

          {/* Orbiting Particles */}
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className={cn("absolute top-1/2 left-1/2 h-2 w-2 rounded-full", color.replace("text-", "bg-"))}
              animate={{
                x: [0, Math.cos(i * 120) * 60, 0],
                y: [0, Math.sin(i * 120) * 60, 0],
                scale: [1, 1.5, 1],
                opacity: [0, 1, 0]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.4,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>
        
        {/* Loading Content */}
        <div className="mt-12 flex flex-col items-center gap-4 text-center">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-1"
          >
            <h3 className="text-sm font-black tracking-widest uppercase opacity-40">{text}</h3>
            <div className="flex gap-1 justify-center">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
                  className={cn("h-1.5 w-1.5 rounded-full", color.replace("text-", "bg-"))}
                />
              ))}
            </div>
          </motion.div>

          {/* Premium Loading Line */}
          <div className="h-0.5 w-48 overflow-hidden rounded-full bg-white/5">
            <motion.div 
              className={cn("h-full", color.replace("text-", "bg-"))}
              animate={{
                x: ["-100%", "200%"]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </div>
        </div>
      </div>

      {/* Modern Watermark */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.1 }}
        className="absolute bottom-12 flex items-center gap-2 grayscale"
      >
        <span className="text-xs font-black tracking-[0.3em] uppercase">MedQs Premium</span>
      </motion.div>
    </div>
  );
}
