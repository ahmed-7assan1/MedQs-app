"use client";

import { ArrowLeft, Plus, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface AIChatMobileHeaderProps {
  onNewTopic: () => void;
  onBack?: () => void;
}

export function AIChatMobileHeader({ onNewTopic, onBack }: AIChatMobileHeaderProps) {
  return (
    <div className="flex flex-col sticky top-0 z-50 bg-drq-bg/95 backdrop-blur-md">
      {/* Top Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b-[0.5px] border-drq-border">
        {/* Left: Back */}
        <button
          onClick={onBack}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-white active:bg-white/10 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>

        {/* Center: Branding */}
        <div className="flex flex-col items-center gap-0.5">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-drq-primary text-[10px] font-bold text-white">Q</div>
            <span className="text-sm font-bold text-white">Dr. Q Coach</span>
          </div>
          <span className="text-[10px] font-medium text-drq-purple-light/60">Study assistant</span>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={onNewTopic}
            className="flex h-8 w-8 items-center justify-center rounded-full text-white/60 hover:text-white"
          >
            <Plus className="h-5 w-5" />
          </button>
          <button className="flex h-8 w-8 items-center justify-center rounded-full text-white/60 hover:text-white">
            <MoreHorizontal className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Disclaimer Strip */}
      <div className="flex justify-center py-2 px-4">
        <div className="inline-flex items-center px-3 py-1 rounded-lg bg-white/5 border border-white/[0.03] text-[10px] font-medium text-white/40">
          For study use only — not medical advice or diagnosis
        </div>
      </div>
    </div>
  );
}
