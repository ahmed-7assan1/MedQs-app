import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex h-[calc(100vh-80px)] w-full flex-col bg-[#0a0910] text-white relative overflow-hidden">
      {/* Immersive background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(88,28,135,0.06)_0%,rgba(10,9,16,0)_70%)]" />
        <div className="absolute top-[20%] left-[20%] w-[350px] h-[350px] bg-purple-600/03 rounded-full blur-[80px] animate-pulse" />
      </div>

      {/* Top Header Placeholder */}
      <div className="h-28 md:h-20 pt-12 md:pt-0 flex items-center justify-between px-6 relative z-30 border-b border-white/[0.04]">
        <div className="flex items-center gap-4 w-full">
          <Skeleton className="h-9 w-9 rounded-full bg-white/5" />
          <Skeleton className="h-8 w-44 rounded-full bg-white/5" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-full bg-white/5 hidden sm:block" />
          <Skeleton className="h-9 w-9 rounded-full bg-white/5" />
        </div>
      </div>

      {/* Message Area Placeholder */}
      <div className="flex-1 p-6 md:p-8 space-y-8 overflow-hidden max-w-4xl w-full mx-auto relative z-10 flex flex-col justify-end">
        {/* Central Glowing Orb Loading Indicator */}
        <div className="flex-1 flex flex-col items-center justify-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 blur-[1px] shadow-[0_0_30px_rgba(168,85,247,0.4)] animate-pulse" />
            <div className="absolute inset-0 w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
              <div className="w-2.5 h-2.5 bg-white rounded-full animate-ping" />
            </div>
          </div>
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-400 animate-pulse">
            Connecting to Dr. Q AI...
          </div>
        </div>

        {/* Bubble 1 (AI) */}
        <div className="flex items-start gap-4 max-w-[80%]">
          <Skeleton className="h-10 w-10 rounded-xl bg-white/5 shrink-0" />
          <div className="space-y-2.5 w-full">
            <Skeleton className="h-4 w-[40%] rounded-md bg-white/5" />
            <Skeleton className="h-16 w-full rounded-2xl bg-white/5" />
          </div>
        </div>

        {/* Bubble 2 (User) */}
        <div className="flex items-start gap-4 max-w-[80%] self-end flex-row-reverse">
          <Skeleton className="h-10 w-10 rounded-xl bg-white/5 shrink-0" />
          <div className="space-y-2.5 w-full flex flex-col items-end">
            <Skeleton className="h-4 w-[25%] rounded-md bg-white/5" />
            <Skeleton className="h-12 w-full rounded-2xl bg-white/10" />
          </div>
        </div>

        {/* Bubble 3 (AI) */}
        <div className="flex items-start gap-4 max-w-[80%]">
          <Skeleton className="h-10 w-10 rounded-xl bg-white/5 shrink-0" />
          <div className="space-y-2.5 w-full">
            <Skeleton className="h-4 w-[30%] rounded-md bg-white/5" />
            <Skeleton className="h-24 w-full rounded-2xl bg-white/5" />
          </div>
        </div>
      </div>

      {/* Bottom Composer Placeholder */}
      <div className="p-4 md:p-6 border-t border-white/[0.04] relative z-20">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <Skeleton className="h-11 flex-1 rounded-2xl bg-white/5" />
          <Skeleton className="h-11 w-11 rounded-2xl bg-white/5 shrink-0" />
        </div>
      </div>
    </div>
  );
}
