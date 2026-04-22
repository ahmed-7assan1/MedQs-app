"use client";

import { useState, useRef, useEffect } from "react";
import { User, LogOut, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function GuestSignOutButton() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSignOut = async () => {
    await fetch("/api/v1/guest-quiz/session", { method: "DELETE" });
    window.location.href = "/guest/past-papers";
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "flex h-9 items-center gap-2 rounded-xl border px-3 py-1.5 transition-all active:scale-95",
          open 
            ? "border-sky-500 bg-sky-500/10 ring-2 ring-sky-500/20" 
            : "border-border bg-card/50 hover:border-sky-500/50 hover:bg-muted"
        )}
      >
        <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-sky-500/10">
          <User className="h-3.5 w-3.5 text-sky-500" />
        </div>
        <span className="text-xs font-bold text-foreground">Guest Account</span>
        <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform duration-200", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-[60] w-56 rounded-2xl border border-white/[0.03] bg-card/95 shadow-2xl backdrop-blur-xl overflow-hidden animate-in slide-in-from-top-2 fade-in duration-150">
          <div className="border-b border-white/[0.02] px-4 py-3 bg-muted/20">
            <p className="text-sm font-bold truncate text-foreground">Guest User</p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Limited access mode</p>
          </div>
          
          <div className="py-1.5">
            <div className="px-4 py-2 text-[12px] text-muted-foreground leading-relaxed">
              You are currently using the platform as a guest. All progress is temporary.
            </div>
          </div>

          <div className="border-t border-white/[0.02] py-1.5">
            <button
              onClick={handleSignOut}
              className="flex w-full items-center gap-2.5 px-4 py-2 text-[13px] font-medium text-sky-600 hover:bg-sky-500/10 transition-colors"
            >
              <LogOut className="h-4 w-4" /> Change identity
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

