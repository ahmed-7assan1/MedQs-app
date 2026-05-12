"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { 
  Stethoscope
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { 
  DashboardSkeleton, 
  ModulesSkeleton, 
  ForumSkeleton, 
  QuizSkeleton 
} from "@/components/ui/skeletons";

const SKELETON_MAP: Record<string, React.ComponentType> = {
  "/dashboard": DashboardSkeleton,
  "/modules": ModulesSkeleton,
  "/social": ForumSkeleton,
  "/forum": ForumSkeleton,
  "/past-papers": QuizSkeleton,
  "/quiz": QuizSkeleton,
};

export default function GlobalLoading() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Find the matching skeleton or null
  const matchedPath = Object.keys(SKELETON_MAP).find(key => pathname?.startsWith(key));
  const SkeletonComponent = matchedPath ? SKELETON_MAP[matchedPath] : null;

  return (
    <AnimatePresence mode="wait">
      <motion.div 
        key={pathname + (SkeletonComponent ? "-skeleton" : "-default")}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[9999] flex flex-col bg-background overflow-y-auto no-scrollbar"
      >
        {SkeletonComponent ? (
          <div className="w-full pt-20">
            <SkeletonComponent />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center min-h-screen">
            <div className="relative flex flex-col items-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="p-5 rounded-[28px] bg-white/[0.02] border border-white/5 backdrop-blur-md shadow-xl text-primary"
              >
                <Stethoscope size={40} strokeWidth={2} className="animate-pulse" />
              </motion.div>
              <div className="mt-8 flex flex-col items-center gap-3 text-center">
                <h3 className="text-[10px] font-black tracking-widest uppercase opacity-40">MedOneX is preparing</h3>
                <div className="h-0.5 w-32 overflow-hidden rounded-full bg-white/5">
                  <motion.div 
                    className="h-full bg-primary"
                    animate={{ x: ["-100%", "200%"] }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
