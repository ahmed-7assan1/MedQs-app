"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Sparkle, X, ShieldCheck, CheckCircle } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";

export function PremiumNotificationPrompt() {
  const [show, setShow] = useState(false);
  const [status, setStatus] = useState<"prompt" | "loading" | "success">("prompt");

  useEffect(() => {
    // Check if we already have permission or if we should show the prompt
    if ("Notification" in window) {
      if (Notification.permission === "default") {
        const hasSeenPrompt = localStorage.getItem("medqs_notif_prompt_seen");
        if (!hasSeenPrompt) {
          const timer = setTimeout(() => setShow(true), 5000); // Show after 5s
          return () => clearTimeout(timer);
        }
      }
    }
  }, []);

  const handleRequest = async () => {
    setStatus("loading");
    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        // Register Push Subscription here
        await registerPush();
        setStatus("success");
        setTimeout(() => setShow(false), 2000);
      } else {
        setShow(false);
      }
      localStorage.setItem("medqs_notif_prompt_seen", "true");
    } catch (error) {
      console.error("Notification request failed", error);
      setShow(false);
    }
  };

  const registerPush = async () => {
    if (!("serviceWorker" in navigator)) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Get VAPID public key from env or config
      // For now we'll assume it's set up in the background
      const res = await fetch("/api/v1/push/vapid-public-key");
      const { publicKey } = await res.json();

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: publicKey
      });

      await fetch("/api/v1/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription })
      });
    } catch (err) {
      console.error("Push registration failed", err);
    }
  };

  return (
    <AnimatePresence>
      {show && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-full max-w-md overflow-hidden rounded-[32px] border border-white/10 bg-[#0F0F15] shadow-2xl"
          >
            {/* Header / Graphic */}
            <div className="relative h-48 bg-gradient-to-br from-primary/30 via-violet-500/10 to-transparent flex items-center justify-center">
              <div className="absolute inset-0 mesh-gradient-bg opacity-30" />
              <div className="relative">
                <motion.div
                  animate={{ 
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{ duration: 4, repeat: Infinity }}
                  className="h-24 w-24 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30 backdrop-blur-xl"
                >
                  <Bell weight="duotone" className="h-12 w-12 text-primary" />
                </motion.div>
                <Sparkle weight="fill" className="absolute -top-2 -right-2 h-6 w-6 text-amber-400 animate-pulse" />
              </div>
            </div>

            {/* Content */}
            <div className="p-8 text-center">
              <h2 className="text-2xl font-black text-white mb-3">Stay Connected</h2>
              <p className="text-white/60 text-sm leading-relaxed mb-8">
                Receive real-time updates about your lectures, quizzes, and community discussions even when you&rsquo;re offline.
              </p>

              <div className="space-y-3">
                <button
                  onClick={handleRequest}
                  disabled={status === "loading"}
                  className={cn(
                    "w-full h-14 rounded-2xl flex items-center justify-center gap-2 font-black uppercase tracking-widest transition-all",
                    status === "success" 
                      ? "bg-emerald-500 text-white" 
                      : "bg-primary text-white shadow-lg shadow-primary/30 hover:scale-[1.02] active:scale-[0.98]"
                  )}
                >
                  {status === "prompt" && (
                    <>
                      <ShieldCheck weight="bold" className="h-5 w-5" />
                      Enable Notifications
                    </>
                  )}
                  {status === "loading" && (
                    <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  )}
                  {status === "success" && (
                    <>
                      <CheckCircle weight="bold" className="h-5 w-5" />
                      Activated
                    </>
                  )}
                </button>

                <button
                  onClick={() => setShow(false)}
                  className="w-full h-12 rounded-xl text-white/30 text-xs font-bold uppercase tracking-widest hover:text-white/60 transition-colors"
                >
                  Maybe Later
                </button>
              </div>
            </div>

            {/* Footer Trust */}
            <div className="px-8 py-4 bg-white/5 border-t border-white/5 flex items-center justify-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Secure & Privacy-First</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
