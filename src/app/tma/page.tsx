"use client";

import React, { useEffect, useState } from "react";
import Script from "next/script";
import { PhosphorIcon } from "@/components/system/PhosphorIcon";
import "../../styles/tma.css";

interface TMAUser {
  id: string;
  name: string;
  points: number;
  university: string;
  role: string;
  image?: string;
}

export default function TelegramMiniAppPage() {
  const [tgUser, setTgUser] = useState<any>(null);
  const [dbUser, setDbUser] = useState<TMAUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const initTma = () => {
      try {
        const webApp = (window as any).Telegram?.WebApp;
        if (webApp) {
          webApp.ready();
          webApp.expand();
          // Set header color to match telegram theme
          webApp.setHeaderColor?.('secondary_bg_color');
          
          const user = webApp.initDataUnsafe?.user;
          if (user) {
            console.log("[TMA] User found:", user.id);
            setTgUser(user);
            fetchUserData(user.id.toString());
          } else {
            console.warn("[TMA] No user data in initDataUnsafe");
            // For testing in browser, don't show error immediately
            if (process.env.NODE_ENV === 'development') {
                setTgUser({ id: "dev_test", first_name: "Dev User" });
                fetchUserData("dev_test");
            } else {
                setError("Could not identify your Telegram account. Please try opening from the bot.");
                setLoading(false);
            }
          }
        } else {
            // If WebApp is not available after 5 seconds, show error
            setTimeout(() => {
                if (!(window as any).Telegram?.WebApp) {
                    setError("Telegram SDK failed to load. Please check your connection.");
                    setLoading(false);
                }
            }, 5000);
        }
      } catch (err: any) {
        setError("Initialization error: " + err.message);
        setLoading(false);
      }
    };

    if ((window as any).Telegram?.WebApp) {
      initTma();
    }
  }, [retryCount]);

  const fetchUserData = async (telegramId: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/telegram/user?id=${telegramId}`);
      const data = await res.json();
      
      if (!res.ok) {
        if (res.status === 404) throw new Error("Account not linked");
        throw new Error(data.error || "Failed to fetch profile");
      }
      
      setDbUser(data);
    } catch (err: any) {
      console.error("[TMA] Fetch Error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };

  if (loading) {
    return (
      <div className="tma-container flex flex-col items-center justify-center">
        <div className="text-center">
          <div className="tma-avatar mb-4 mx-auto animate-bounce bg-primary/20 text-primary">Q</div>
          <p className="tma-label animate-pulse">Syncing with MedOneX...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="tma-container flex flex-col items-center justify-center p-6">
        <div className="glass-card w-full text-center py-10">
          <div className="text-5xl mb-6">⚠️</div>
          <h1 className="text-xl font-bold mb-3">Connection Issue</h1>
          <p className="tma-hint mb-8 px-4">
            {error === "Account not linked" 
              ? "Your Telegram is not linked to an email. Please send your registered email to the bot first."
              : error}
          </p>
          
          <div className="space-y-3">
            <button 
                onClick={handleRetry}
                className="w-full bg-primary text-white py-3 rounded-xl font-bold active:scale-95 transition-transform"
            >
                Try Again
            </button>
            <button 
                onClick={() => (window as any).Telegram?.WebApp?.close()}
                className="w-full bg-white/10 text-tma-text py-3 rounded-xl font-medium"
            >
                Close App
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="tma-container">
      <Script 
        src="https://telegram.org/js/telegram-web-app.js" 
        strategy="beforeInteractive"
      />

      {/* Header */}
      <div className="tma-header">
        <div className="tma-user-badge">
          <div className="tma-avatar">
            {dbUser?.image ? (
                <img src={dbUser.image} alt="Profile" className="w-full h-full rounded-[14px] object-cover" />
            ) : (
                <span className="text-white">{(dbUser?.name?.[0] || "U").toUpperCase()}</span>
            )}
          </div>
          <div>
            <h2 className="font-bold text-lg leading-tight">Dr. {dbUser?.name.split(' ')[0]}</h2>
            <p className="text-xs tma-hint truncate max-w-[150px]">{dbUser?.university}</p>
          </div>
        </div>
        <div className="tma-points-badge">
          {dbUser?.points || 0} pts
        </div>
      </div>

      {/* AI Assistant Quick Access */}
      <div className="glass-card border-l-4 border-l-primary relative overflow-hidden">
        <div className="absolute top-[-20px] right-[-20px] opacity-10 text-primary">
            <PhosphorIcon name="Brain" size={100} weight="fill" />
        </div>
        <div className="flex items-center gap-3 mb-4 relative z-10">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <PhosphorIcon name="MagicWand" weight="fill" size={22} />
          </div>
          <div>
            <h3 className="font-bold">Ask Dr. Q</h3>
            <p className="text-[10px] uppercase tracking-wider tma-hint">Medical Intelligence</p>
          </div>
        </div>
        <div className="relative z-10">
          <input 
            type="text" 
            placeholder="Ask a medical question..." 
            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 pr-12 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
          />
          <button className="absolute right-1.5 top-1.5 w-9 h-9 rounded-lg bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20">
            <PhosphorIcon name="ArrowRight" weight="bold" size={18} />
          </button>
        </div>
      </div>

      {/* Bento Grid Features */}
      <div className="tma-grid mb-6">
        <div className="glass-card tma-grid-item">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-1">
            <PhosphorIcon name="Books" weight="duotone" size={28} />
          </div>
          <span className="tma-label">Modules</span>
        </div>
        <div className="glass-card tma-grid-item">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center mb-1">
            <PhosphorIcon name="Calendar" weight="duotone" size={28} />
          </div>
          <span className="tma-label">Schedule</span>
        </div>
        <div className="glass-card tma-grid-item">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-1">
            <PhosphorIcon name="Lightning" weight="duotone" size={28} />
          </div>
          <span className="tma-label">Quizzes</span>
        </div>
        <div className="glass-card tma-grid-item">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center mb-1">
            <PhosphorIcon name="Trophy" weight="duotone" size={28} />
          </div>
          <span className="tma-label">Rank</span>
        </div>
      </div>

      {/* Recent Lectures Section */}
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className="text-sm font-bold uppercase tracking-widest tma-hint">Recent Lectures</h3>
        <button className="text-xs text-primary font-bold">View All</button>
      </div>
      
      <div className="glass-card p-0 overflow-hidden divide-y divide-white/5">
        {[
          { t: "CVS Anatomy", m: "Anatomy", d: "2h ago" },
          { t: "Biochemistry of Lipids", m: "Biochem", d: "5h ago" },
          { t: "General Pathology", m: "Pathology", d: "Yesterday" }
        ].map((item, i) => (
          <div key={i} className="tma-list-item hover:bg-white/5 transition-colors">
            <div className="tma-icon-box text-primary/80">
              <PhosphorIcon name="FileText" size={20} weight="duotone" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold">{item.t}</h4>
              <p className="text-[10px] tma-hint">{item.m} • {item.d}</p>
            </div>
            <PhosphorIcon name="CaretRight" size={14} className="tma-hint" />
          </div>
        ))}
      </div>

      <div className="mt-8 text-center pb-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
            <p className="text-[10px] tma-hint font-medium uppercase tracking-tighter">Systems Online • v1.0.4</p>
        </div>
      </div>
    </div>
  );
}
