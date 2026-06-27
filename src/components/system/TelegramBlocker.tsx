"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/providers/SupabaseAuthProvider";
import { 
  TelegramLogo, 
  ArrowRight, 
  CheckCircle, 
  CircleNotch,
  X
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

// TelegramBlocker is now NON-BLOCKING — it wraps children always.
// Telegram linking is optional. The banner only shows as a dismissable notice.
export function TelegramBlocker({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  
  const [showBanner, setShowBanner] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Only show the gentle banner if unverified and not yet dismissed this session
    if (!authLoading && user && !(user as any).telegramVerified && (user as any).user_metadata?.role === "STUDENT") {
      const wasDismissed = sessionStorage.getItem("tg-banner-dismissed");
      if (!wasDismissed) setShowBanner(true);
    } else {
      setShowBanner(false);
    }
  }, [authLoading, user]);

  const handleDismiss = () => {
    sessionStorage.setItem("tg-banner-dismissed", "1");
    setShowBanner(false);
    setDismissed(true);
  };

  // Always render children — Telegram is optional
  return (
    <>
      {children}
      {showBanner && !dismissed && (
        <TelegramOptionalBanner onDismiss={handleDismiss} />
      )}
    </>
  );
}

function TelegramOptionalBanner({ onDismiss }: { onDismiss: () => void }) {
  const [loading, setLoading] = useState(false);

  // Load Telegram Widget
  useEffect(() => {
    (window as any).onTelegramAuth = async (tgUser: any) => {
      setLoading(true);
      try {
        const res = await fetch("/api/v1/auth/telegram/callback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(tgUser),
        });
        if (res.ok) {
          toast.success("Telegram linked successfully!");
          onDismiss();
        } else {
          toast.error("Linking failed. Try again.");
        }
      } finally { setLoading(false); }
    };

    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.setAttribute("data-telegram-login", process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || "MedQsBot");
    script.setAttribute("data-size", "medium");
    script.setAttribute("data-onauth", "onTelegramAuth(user)");
    script.setAttribute("data-request-access", "write");
    script.setAttribute("data-userpic", "false");
    script.async = true;
    const container = document.getElementById("tg-optional-widget");
    if (container) { container.innerHTML = ""; container.appendChild(script); }

    return () => { delete (window as any).onTelegramAuth; };
  }, []);

  return (
    <div className="fixed bottom-6 right-6 z-modal w-full max-w-[360px] animate-in slide-in-from-bottom-4 duration-500">
      <div className="relative rounded-[24px] border border-white/[0.08] bg-[#131220]/95 backdrop-blur-2xl p-5 shadow-2xl shadow-black/40">
        <button 
          onClick={onDismiss}
          className="absolute top-4 right-4 h-7 w-7 rounded-full bg-white/5 flex items-center justify-center text-white/30 hover:text-white hover:bg-white/10 transition-all"
        >
          <X size={14} weight="bold" />
        </button>

        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#229ED9]/10 border border-[#229ED9]/20">
            <TelegramLogo className="h-6 w-6 text-[#229ED9]" weight="fill" />
          </div>
          <div className="flex-1 min-w-0 pr-4">
            <p className="text-sm font-black text-white mb-1">Link Telegram (Optional)</p>
            <p className="text-[11px] text-white/40 leading-relaxed mb-4">
              Connect your Telegram to receive study updates and use the bot assistant.
            </p>
            <div id="tg-optional-widget" className="flex items-center justify-start" />
            {loading && (
              <div className="flex items-center gap-2 mt-2 text-[11px] text-white/40">
                <CircleNotch size={14} className="animate-spin" /> Linking...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
