"use client";

import React, { useEffect, useState, useTransition } from "react";
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
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    // 1. Initialize Telegram Web App
    const initTma = () => {
      const webApp = (window as any).Telegram?.WebApp;
      if (webApp) {
        webApp.ready();
        webApp.expand();
        
        const user = webApp.initDataUnsafe?.user;
        if (user) {
          setTgUser(user);
          fetchUserData(user.id.toString());
        } else {
          // Fallback for testing in browser if needed
          // setError("Please open this app inside Telegram.");
          // setLoading(false);
          
          // FOR DEV TESTING:
          setTgUser({ id: "dev_test", first_name: "Test Student" });
          fetchUserData("dev_test");
        }
      }
    };

    if ((window as any).Telegram?.WebApp) {
      initTma();
    } else {
      // Wait for script to load via Script component if not ready
    }
  }, []);

  const fetchUserData = async (telegramId: string) => {
    try {
      const res = await fetch(`/api/v1/telegram/user?id=${telegramId}`);
      if (!res.ok) throw new Error("Account not linked");
      const data = await res.json();
      setDbUser(data);
    } catch (err: any) {
      console.error("[TMA] Fetch Error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="tma-container flex items-center justify-center">
        <div className="text-center">
          <div className="tma-avatar mb-4 mx-auto animate-pulse">Q</div>
          <p className="tma-hint">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  if (error === "Account not linked") {
    return (
      <div className="tma-container flex flex-col items-center justify-center text-center">
        <div className="glass-card w-full">
          <div className="text-4xl mb-4">🩺</div>
          <h1 className="text-xl font-bold mb-2">Welcome to MedOneX!</h1>
          <p className="tma-hint mb-6">Your Telegram ID is not linked to any account. Please send your registered Email to the bot first.</p>
          <button 
            onClick={() => (window as any).Telegram?.WebApp?.close()}
            className="w-full bg-primary text-white py-3 rounded-xl font-bold"
          >
            Back to Bot
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="tma-container">
      <Script 
        src="https://telegram.org/js/telegram-web-app.js" 
        strategy="beforeInteractive"
        onLoad={() => {
          // Manual trigger if it didn't catch in useEffect
          const webApp = (window as any).Telegram?.WebApp;
          if (webApp && !tgUser) {
            webApp.ready();
            webApp.expand();
            const user = webApp.initDataUnsafe?.user;
            if (user) {
              setTgUser(user);
              fetchUserData(user.id.toString());
            }
          }
        }}
      />

      {/* Header */}
      <div className="tma-header">
        <div className="tma-user-badge">
          <div className="tma-avatar">
            {dbUser?.image ? <img src={dbUser.image} alt="User" className="w-full h-full rounded-[14px]" /> : (dbUser?.name?.[0] || "U")}
          </div>
          <div>
            <h2 className="font-bold text-lg leading-tight">Dr. {dbUser?.name.split(' ')[0]}</h2>
            <p className="text-xs tma-hint">{dbUser?.university || "Medical Student"}</p>
          </div>
        </div>
        <div className="tma-points-badge">
          {dbUser?.points || 0} Points
        </div>
      </div>

      {/* Dr. Q Mini Chat */}
      <div className="glass-card border-l-4 border-l-primary">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <PhosphorIcon name="Brain" weight="fill" size={24} />
          </div>
          <div>
            <h3 className="font-bold">Ask Dr. Q</h3>
            <p className="text-xs tma-hint">Medical Assistant AI</p>
          </div>
        </div>
        <div className="relative">
          <input 
            type="text" 
            placeholder="Ask anything about your lectures..." 
            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 pr-12 text-sm focus:ring-2 focus:ring-primary outline-none"
          />
          <button className="absolute right-2 top-1.5 w-9 h-9 rounded-lg bg-primary text-white flex items-center justify-center">
            <PhosphorIcon name="PaperPlaneTilt" weight="fill" size={20} />
          </button>
        </div>
      </div>

      {/* Bento Grid Features */}
      <div className="tma-grid mb-6">
        <div className="glass-card tma-grid-item">
          <PhosphorIcon name="Books" weight="duotone" />
          <span className="tma-label">Modules</span>
        </div>
        <div className="glass-card tma-grid-item">
          <PhosphorIcon name="Calendar" weight="duotone" />
          <span className="tma-label">Schedule</span>
        </div>
        <div className="glass-card tma-grid-item">
          <PhosphorIcon name="Lightning" weight="duotone" />
          <span className="tma-label">Quizzes</span>
        </div>
        <div className="glass-card tma-grid-item">
          <PhosphorIcon name="Trophy" weight="duotone" />
          <span className="tma-label">Rank</span>
        </div>
      </div>

      {/* Recent Activity */}
      <h3 className="tma-section-title">Recent Lectures</h3>
      <div className="glass-card p-0 overflow-hidden">
        {[1, 2, 3].map((i) => (
          <div key={i} className="tma-list-item">
            <div className="tma-icon-box text-primary">
              <PhosphorIcon name="FileText" size={20} />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold">Anatomy of the Heart</h4>
              <p className="text-xs tma-hint">Module 2 • Cardio</p>
            </div>
            <PhosphorIcon name="CaretRight" size={16} className="tma-hint" />
          </div>
        ))}
      </div>

      <div className="mt-8 text-center">
        <p className="text-[10px] tma-hint uppercase tracking-widest">Powered by MedOneX AI Architecture</p>
      </div>
    </div>
  );
}
