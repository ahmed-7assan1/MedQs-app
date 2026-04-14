"use client";

import { MedQsLogoLockup } from "@/components/branding/MedQsLogo";
import { useEffect, useState } from "react";

export default function GlobalLoading() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background text-foreground transition-opacity duration-500">
      <div className="relative flex flex-col items-center">
        {/* Animated Background Pulse */}
        <div className="absolute inset-0 z-0 animate-ping rounded-full bg-primary/20 blur-3xl duration-1000" />
        
        {/* Pop-in Logo */}
        <div className="z-10 animate-pop-in">
          <MedQsLogoLockup className="scale-125" showTagline={false} />
        </div>
        
        {/* Loading Spinner / Bar */}
        <div className="mt-12 h-1 w-32 overflow-hidden rounded-full bg-muted">
          <div className="h-full w-1/2 animate-[pulse_1s_ease-in-out_infinite] rounded-full bg-primary" style={{ animation: "translateX 1.5s infinite" }}></div>
        </div>
        <p className="mt-4 animate-pulse text-sm tracking-widest text-muted-foreground uppercase">
          Loading...
        </p>
      </div>

      <style jsx>{`
        @keyframes translateX {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  );
}
