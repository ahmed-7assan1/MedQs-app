"use client";

import React, { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { X, Download } from "@phosphor-icons/react";
import { useSiteConfig } from "@/contexts/SiteConfigContext";

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    (window.navigator as any).standalone === true
  );
}

const DISMISSED_KEY = "pwa-install-dismissed";

export function PWAInstallModal({ isDark }: { isDark: boolean }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);
  const { siteName } = useSiteConfig();

  useEffect(() => {
    if (isStandalone()) return;
    if (localStorage.getItem(DISMISSED_KEY) === "true") return;

    const handler = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShow(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const result = await deferredPrompt.userChoice;
    if (result.outcome === "accepted") {
      setShow(false);
      setDeferredPrompt(null);
    }
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    localStorage.setItem(DISMISSED_KEY, "true");
    setShow(false);
  }, []);

  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-max flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={handleDismiss}
    >
      <div
        className={cn(
          "max-w-sm w-full rounded-2xl shadow-2xl border p-6",
          isDark
            ? "bg-[#121212] border-white/10 text-white"
            : "bg-white border-gray-200 text-gray-900"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center",
              isDark ? "bg-white/10" : "bg-gray-100"
            )}>
              <Download size={20} weight="bold" />
            </div>
            <div>
              <h3 className="text-sm font-bold">Install {siteName || "MedOneX"} AI</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Get the app for a better experience</p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className={cn(
              "p-1.5 rounded-lg transition-colors",
              isDark ? "text-gray-400 hover:bg-white/10" : "text-gray-500 hover:bg-gray-100"
            )}
          >
            <X size={18} />
          </button>
        </div>
        <p className={cn(
          "text-sm leading-relaxed mb-5",
          isDark ? "text-gray-400" : "text-gray-600"
        )}>
          Install the AI Chat app to get faster loading, offline access, and a native experience.
        </p>
        <div className="flex gap-2.5">
          <button
            onClick={handleDismiss}
            className={cn(
              "flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors",
              isDark
                ? "bg-white/10 text-gray-300 hover:bg-white/15"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            )}
          >
            Maybe Later
          </button>
          <button
            onClick={handleInstall}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-teal-500 text-white hover:bg-teal-600 transition-colors"
          >
            Install App
          </button>
        </div>
      </div>
    </div>
  );
}
