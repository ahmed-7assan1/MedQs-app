"use client";

import { useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Play, Pause, RotateCcw, Timer } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type TimerState = "idle" | "running" | "paused";

const POMODORO = 25 * 60;
const SHORT_BREAK = 5 * 60;
const LONG_BREAK = 15 * 60;

const pad = (n: number) => n.toString().padStart(2, "0");

const formatTime = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${pad(m)}:${pad(sec)}`;
};

export const StudyTimer = () => {
  const [mode, setMode] = useState<"focus" | "short" | "long">("focus");
  const [remaining, setRemaining] = useState(POMODORO);
  const [state, setState] = useState<TimerState>("idle");
  const [sessions, setSessions] = useState(0);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    try {
      const s = localStorage.getItem("pomodoro-sessions");
      if (s) setSessions(parseInt(s, 10));
    } catch {}
  }, []);

  const saveSessions = useCallback((n: number) => {
    setSessions(n);
    try { localStorage.setItem("pomodoro-sessions", n.toString()); } catch {}
  }, []);

  const total = mode === "focus" ? POMODORO : mode === "short" ? SHORT_BREAK : LONG_BREAK;
  const progress = ((total - remaining) / total) * 100;

  const switchMode = (m: typeof mode) => {
    setMode(m);
    setState("idle");
    setRemaining(m === "focus" ? POMODORO : m === "short" ? SHORT_BREAK : LONG_BREAK);
  };

  const reset = () => {
    setState("idle");
    setRemaining(total);
  };

  useEffect(() => {
    if (state !== "running") return;
    const interval = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          setState("idle");
          if (mode === "focus") saveSessions(sessions + 1);
          return total;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [state, mode, total, sessions, saveSessions]);

  const r = 32;
  const circ = 2 * Math.PI * r;
  const offset = circ - (circ * progress) / 100;

  return (
    <Card className="relative">
      <CardContent className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <Timer size={14} className="text-primary" />
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Study Timer</span>
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <button className="text-[10px] font-bold text-foreground/40 hover:text-foreground uppercase tracking-wider">
              {mode}
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-36 p-1">
            {(["focus", "short", "long"] as const).map((m) => (
              <button
                key={m}
                onClick={() => { switchMode(m); }}
                className={cn("w-full px-3 py-2 text-left text-xs font-bold uppercase tracking-wider hover:bg-muted rounded-md transition-colors", mode === m ? "text-primary" : "text-foreground/60")}
              >
                {m === "focus" ? "Focus (25m)" : m === "short" ? "Short (5m)" : "Long (15m)"}
              </button>
            ))}
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex flex-col items-center gap-3">
        <div className="relative">
          <svg width="80" height="80" className="-rotate-90">
            <circle cx="40" cy="40" r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth="5" />
            <circle
              cx="40" cy="40" r={r}
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={circ}
              strokeDashoffset={offset}
              className="timer-ring"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-black text-foreground tabular-nums">{formatTime(remaining)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {state === "idle" || state === "paused" ? (
            <button onClick={() => setState("running")} className="flex items-center gap-1 px-4 py-1.5 rounded-xl bg-primary text-white text-[10px] font-black uppercase tracking-wider hover:scale-105 active:scale-95 transition-all">
              <Play size={12} /> {state === "paused" ? "Resume" : "Start"}
            </button>
          ) : (
            <button onClick={() => setState("paused")} className="flex items-center gap-1 px-4 py-1.5 rounded-xl bg-amber-500 text-white text-[10px] font-black uppercase tracking-wider hover:scale-105 active:scale-95 transition-all">
              <Pause size={12} /> Pause
            </button>
          )}
          {state !== "idle" && (
            <button onClick={reset} className="p-1.5 rounded-lg bg-muted text-foreground/50 hover:text-foreground transition-all">
              <RotateCcw size={14} />
            </button>
          )}
        </div>

        <p className="text-[9px] font-bold text-foreground/30 uppercase tracking-wider">
          {sessions} session{sessions !== 1 ? "s" : ""} today
        </p>
      </div>
      </CardContent>
    </Card>
  );
};
