import React from "react";
import { StudentPageShell } from "@/components/layout/StudentPageShell";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <StudentPageShell maxWidthClass="max-w-5xl" className="lg:pt-10">
      {/* 1. Header Section Skeleton */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-10 px-2 lg:px-0">
        <div className="space-y-3 text-center md:text-left w-full md:w-auto">
          <div className="flex items-center justify-center md:justify-start gap-2">
            <Skeleton className="h-4 w-4 rounded-full bg-slate-200 dark:bg-white/5" />
            <Skeleton className="h-3 w-28 rounded-md bg-slate-200 dark:bg-white/5" />
          </div>
          <Skeleton className="h-10 w-48 rounded-2xl bg-slate-200 dark:bg-white/5 mx-auto md:mx-0" />
          <Skeleton className="h-4 w-64 rounded-md bg-slate-200 dark:bg-white/5 mx-auto md:mx-0" />
        </div>

        {/* Progress Circle Skeleton Card */}
        <div className="flex items-center gap-6 p-4 rounded-[2rem] bg-card border border-slate-100 dark:border-white/[0.02] shadow-sm w-full md:w-64 max-w-sm">
          <div className="relative h-16 w-16 flex items-center justify-center">
            {/* Pulsing loading circle SVG */}
            <svg className="absolute h-full w-full -rotate-90 transform" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="16" fill="none" className="stroke-slate-100 dark:stroke-white/5 animate-pulse" strokeWidth="3" />
            </svg>
            <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-white/5 animate-pulse" />
          </div>
          <div className="space-y-2 flex-1">
            <Skeleton className="h-3 w-20 rounded-md bg-slate-200 dark:bg-white/5" />
            <Skeleton className="h-5 w-24 rounded-lg bg-slate-200 dark:bg-white/5" />
          </div>
        </div>
      </div>

      {/* 2. Tab Switcher Skeleton */}
      <div className="mb-10 flex flex-col items-center">
        <div className="inline-flex items-center p-1.5 rounded-2xl bg-muted/20 border border-slate-100 dark:border-white/[0.02]">
          <Skeleton className="h-9 w-32 rounded-xl bg-slate-200 dark:bg-white/5" />
          <div className="w-1" />
          <Skeleton className="h-9 w-32 rounded-xl bg-slate-200 dark:bg-white/5" />
        </div>
      </div>

      {/* 3. Daily Content Skeleton Container */}
      <div className="space-y-6">
        {/* Horizontal Calendar Bar Skeleton */}
        <div className="flex items-center justify-between gap-2.5 pb-6 overflow-x-auto no-scrollbar">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-card border border-slate-100 dark:border-white/[0.02] w-14 shrink-0">
              <Skeleton className="h-3 w-6 rounded-md bg-slate-200 dark:bg-white/5" />
              <Skeleton className="h-7 w-7 rounded-full bg-slate-200 dark:bg-white/5" />
            </div>
          ))}
        </div>

        {/* Task Checklist Items */}
        <div className="space-y-3.5">
          <Skeleton className="h-4 w-32 rounded-md bg-slate-200 dark:bg-white/5" />
          
          {[...Array(4)].map((_, i) => (
            <div key={i} className="p-5 rounded-[2rem] bg-card border border-slate-100 dark:border-white/[0.02] shadow-sm flex items-center gap-4">
              {/* Checkbox Placeholder */}
              <Skeleton className="h-6 w-6 rounded-lg bg-slate-200 dark:bg-white/5 shrink-0" />
              
              <div className="flex-1 space-y-2 min-w-0">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-48 rounded-lg bg-slate-200 dark:bg-white/5" />
                  <Skeleton className="h-4 w-12 rounded-full bg-slate-200 dark:bg-white/5" />
                </div>
                <Skeleton className="h-3 w-[70%] rounded-md bg-slate-200 dark:bg-white/5" />
              </div>
              
              {/* Chevron Arrow */}
              <Skeleton className="h-5 w-5 rounded-full bg-slate-200 dark:bg-white/5 shrink-0 hidden sm:block" />
            </div>
          ))}
        </div>
      </div>
    </StudentPageShell>
  );
}
