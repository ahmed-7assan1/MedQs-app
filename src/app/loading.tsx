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
  "default": { icon: Stethoscope, text: "MedOneX is preparing", color: "text-primary" }
};

export default function GlobalLoading() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const configKey = Object.keys(LOADING_CONFIG).find(key => pathname?.startsWith(key)) || "default";
  const { icon: Icon, text, color } = LOADING_CONFIG[configKey];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background"
    >
      <div className="relative flex flex-col items-center">
        {/* Simplified Icon */}
        <div className="relative z-10">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={cn("p-5 rounded-[28px] bg-white/[0.02] border border-white/5 backdrop-blur-md shadow-xl", color)}
          >
            <Icon size={40} strokeWidth={2} className="animate-pulse" />
          </motion.div>
        </div>
        
        {/* Loading Content */}
        <div className="mt-8 flex flex-col items-center gap-3 text-center">
          <h3 className="text-[10px] font-black tracking-widest uppercase opacity-40">{text}</h3>
          
          <div className="h-0.5 w-32 overflow-hidden rounded-full bg-white/5">
            <motion.div 
              className={cn("h-full", color.replace("text-", "bg-"))}
              animate={{ x: ["-100%", "200%"] }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
