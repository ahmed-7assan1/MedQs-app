"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { 
  TelegramLogo, 
  ShieldWarning, 
  ArrowRight, 
  CheckCircle, 
  CircleNotch,
  PaperPlaneTilt
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

export function TelegramBlocker({ children }: { children: React.ReactNode }) {
  const { data: session, status, update } = useSession();
  const user = session?.user as any;
  
  const [showBlocker, setShowBlocker] = useState(false);
  const [step, setStep] = useState(1); // 1: Info, 2: Phone Input, 3: Code Input
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    // Load Telegram Login Widget Script
    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.async = true;
    document.body.appendChild(script);
    return () => { document.body.removeChild(script); };
  }, []);

  async function onTelegramAuth(user: any) {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/auth/telegram/callback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(user),
      });
      if (res.ok) {
        toast.success("Verified via Telegram!");
        await update();
        setShowBlocker(false);
      } else {
        toast.error("Verification failed");
      }
    } finally { setLoading(false); }
  }

  // Expose callback to window for the widget
  useEffect(() => {
    (window as any).onTelegramAuth = onTelegramAuth;
  }, []);

  useEffect(() => {
    if (status === "authenticated" && user && !user.telegramVerified && user.role === "STUDENT") {
      setShowBlocker(true);
    } else {
      setShowBlocker(false);
    }
  }, [status, user]);

  useEffect(() => {
    if (timer > 0) {
      const t = setTimeout(() => setTimer(timer - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [timer]);

  async function handleRequestCode() {
    if (!phone || phone.length < 10) return toast.error("Enter a valid phone number");
    setLoading(true);
    try {
      const res = await fetch("/api/v1/auth/telegram/request-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: phone }),
      });
      if (res.ok) {
        setStep(3);
        setTimer(60);
        toast.success("Code sent to Telegram!");
      } else {
        const d = await res.json();
        toast.error(d.error || "Failed to send code. Link with bot first.");
      }
    } finally { setLoading(false); }
  }

  async function handleVerify() {
    if (code.length !== 6) return toast.error("Enter 6-digit code");
    setLoading(true);
    try {
      const res = await fetch("/api/v1/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telegramPhone: phone, verificationCode: code }),
      });
      if (res.ok) {
        toast.success("Verified successfully!");
        await update(); // Refresh session
        setShowBlocker(false);
      } else {
        const d = await res.json();
        toast.error(d.error || "Verification failed");
      }
    } finally { setLoading(false); }
  }

  if (!showBlocker) return <>{children}</>;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#09080F]/80 backdrop-blur-xl p-6">
      <div className="relative w-full max-w-[440px] overflow-hidden rounded-[32px] border border-white/[0.08] bg-[#131220] p-8 shadow-2xl shadow-primary/20 animate-in zoom-in-95 duration-500">
        
        {/* Ambient Glow */}
        <div className="absolute -top-24 -left-24 h-48 w-48 rounded-full bg-primary/20 blur-[80px]" />
        <div className="absolute -bottom-24 -right-24 h-48 w-48 rounded-full bg-primary/10 blur-[80px]" />

        <div className="relative z-10 flex flex-col items-center text-center">
          {/* Icon Header */}
          <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-[24px] bg-primary/10 border border-primary/20 shadow-inner">
            <TelegramLogo className="h-10 w-10 text-primary" weight="fill" />
          </div>

          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="mb-3 font-display text-2xl font-black tracking-tight text-white">Telegram Required</h2>
              <p className="mb-8 text-sm leading-relaxed text-white/40">
                To ensure platform security and receive important academic updates, all students must link their verified Telegram account.
              </p>
              <button onClick={() => setStep(2)}
                className="group flex w-full items-center justify-center gap-2 rounded-2xl btn-gradient py-5 text-sm font-black uppercase tracking-wider text-white shadow-xl transition-all hover:opacity-90 active:scale-[0.98]">
                Link Account Now <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="mb-2 font-display text-2xl font-black tracking-tight text-white">Your Phone</h2>
              <p className="mb-6 text-[13px] text-white/35">Enter the number linked to your Telegram.</p>
              
              <div className="space-y-4">
                <input 
                  value={phone} 
                  onChange={e => setPhone(e.target.value)} 
                  placeholder="+20 10 XXXX XXXX" 
                  type="tel"
                  className="w-full rounded-2xl border border-white/[0.07] bg-[#1a1929] px-6 py-5 text-center text-lg font-bold text-white outline-none transition-all focus:border-primary/40 focus:ring-4 focus:ring-primary/5 placeholder:text-white/10" 
                />
                
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] text-left">
                  <p className="text-[11px] text-white/30 leading-relaxed">
                    1. Open <a href="https://t.me/MedQsBot" target="_blank" className="text-primary font-bold">@MedQsBot</a><br/>
                    2. Click <b>"Link via Phone"</b> button<br/>
                    3. Share your contact with the bot
                  </p>
                </div>

                <button onClick={handleRequestCode} disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl btn-gradient py-5 text-sm font-black uppercase tracking-wider text-white shadow-xl transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50">
                  {loading ? <CircleNotch className="h-5 w-5 animate-spin" /> : <PaperPlaneTilt className="h-5 w-5" />}
                  {loading ? "Sending..." : "Request Code"}
                </button>
                
                <div className="flex flex-col gap-3 mt-4">
                  <a 
                    href="https://t.me/MedQsBot" 
                    target="_blank" 
                    className="text-[11px] font-bold uppercase tracking-widest text-primary hover:underline flex items-center justify-center gap-1"
                  >
                    Didn't get code? Open Bot Directly
                  </a>
                  <button onClick={() => setStep(1)} className="text-[11px] font-bold uppercase tracking-widest text-white/20 hover:text-white">Cancel</button>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="mb-2 font-display text-2xl font-black tracking-tight text-white">Verify Code</h2>
              <p className="mb-6 text-[13px] text-white/35">Enter the 6-digit code sent to your bot.</p>

              <div className="space-y-4">
                <input 
                  value={code} 
                  onChange={e => setCode(e.target.value)} 
                  placeholder="000000" 
                  maxLength={6}
                  className="w-full rounded-2xl border border-white/[0.07] bg-[#1a1929] px-6 py-5 text-center text-2xl font-black tracking-[0.5em] text-white outline-none transition-all focus:border-primary/40 focus:ring-4 focus:ring-primary/5 placeholder:text-white/10" 
                />

                <button onClick={handleVerify} disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-5 text-sm font-black uppercase tracking-wider text-white shadow-xl transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50">
                  {loading ? <CircleNotch className="h-5 w-5 animate-spin" /> : <CheckCircle className="h-5 w-5" />}
                  {loading ? "Confirming..." : "Verify & Unlock"}
                </button>

                <div className="flex flex-col gap-2">
                  <button onClick={handleRequestCode} disabled={loading || timer > 0} className="text-[11px] font-bold text-white/20 hover:text-white disabled:opacity-30">
                    {timer > 0 ? `Resend in ${timer}s` : "Resend Code"}
                  </button>
                  
                  {/* Fallback to Telegram Service */}
                  <div className="pt-4 border-t border-white/5 mt-2 flex flex-col items-center gap-3">
                    <p className="text-[10px] text-white/20 uppercase tracking-widest font-bold">Or use official service</p>
                    <button 
                      onClick={() => {
                        const botName = "MedQsBot";
                        const script = document.createElement("script");
                        script.async = true;
                        script.src = "https://telegram.org/js/telegram-widget.js?22";
                        script.setAttribute("data-telegram-login", botName);
                        script.setAttribute("data-size", "large");
                        script.setAttribute("data-onauth", "onTelegramAuth(user)");
                        script.setAttribute("data-request-access", "write");
                        const container = document.getElementById("tg-login-container");
                        if (container) {
                          container.innerHTML = "";
                          container.appendChild(script);
                        }
                      }}
                      className="text-[11px] font-bold text-primary hover:underline"
                    >
                      Verify via Telegram Service Message
                    </button>
                    <div id="tg-login-container"></div>
                  </div>

                  <button onClick={() => setStep(2)} className="text-[11px] font-bold text-white/20 hover:text-white mt-4">Change Phone Number</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
