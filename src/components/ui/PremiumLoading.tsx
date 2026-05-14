"use client";

import { motion } from "framer-motion";
import { MedOneXLogoMark } from "@/components/branding/MedQsLogo";

export function PremiumLoading() {
  return (
    <div className="fixed inset-0 z-[999] flex flex-col items-center justify-center bg-white dark:bg-[#09080F] overflow-hidden">
      {/* Dynamic Background Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-50">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-primary/10 blur-[140px] rounded-full"
        />
        <motion.div 
          animate={{ scale: [1, 1.3, 1], rotate: [0, -120, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[-20%] left-[-10%] w-[700px] h-[700px] bg-blue-500/10 blur-[120px] rounded-full"
        />
      </div>

      <div className="relative flex flex-col items-center">
        {/* Animated Logo Container */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative mb-8"
        >
          {/* Glowing Ring */}
          <motion.div
            animate={{ 
              scale: [1, 1.15, 1],
              rotate: [0, 360],
              opacity: [0.3, 0.6, 0.3]
            }}
            transition={{ 
              duration: 4, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
            className="absolute inset-[-20px] rounded-[40px] border-2 border-dashed border-primary/30"
          />
          
          <div className="h-24 w-24 rounded-[32px] bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center shadow-2xl backdrop-blur-xl relative z-10 overflow-hidden group">
            <div className="absolute inset-0 bg-primary/5 group-hover:bg-primary/10 transition-colors" />
            <MedOneXLogoMark className="h-12 w-12 text-primary" interactiveColor={true} />
          </div>
        </motion.div>

        {/* Text Animation */}
        <div className="text-center space-y-2">
          <motion.h2
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-2xl font-black tracking-tighter text-slate-800 dark:text-white"
          >
            MedOneX <span className="text-primary font-black">Social</span>
          </motion.h2>
          <motion.p
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 dark:text-white/20"
          >
            Synchronizing your ecosystem
          </motion.p>
        </div>

        {/* Progress Bar */}
        <div className="mt-12 w-48 h-1 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden relative">
          <motion.div
            animate={{ 
              x: ["-100%", "100%"] 
            }}
            transition={{ 
              duration: 1.5, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-primary to-transparent"
          />
        </div>
      </div>
    </div>
  );
}
