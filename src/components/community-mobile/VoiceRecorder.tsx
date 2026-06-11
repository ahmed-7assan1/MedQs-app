"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Microphone, Square, Trash, Check } from "@phosphor-icons/react";

interface VoiceRecorderProps {
  onDone: (seconds: number | null) => void;
}

export function VoiceRecorder({ onDone }: VoiceRecorderProps) {
  const [state, setState] = useState<"idle" | "recording" | "done">("idle");
  const [seconds, setSeconds] = useState(0);
  const [bars, setBars] = useState<number[]>(Array(24).fill(4));
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const barsRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (barsRef.current) clearInterval(barsRef.current);
    };
  }, []);

  const start = () => {
    setState("recording");
    setSeconds(0);
    timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    barsRef.current = setInterval(() => {
      setBars(() => Array.from({ length: 24 }, () => Math.floor(Math.random() * 26) + 4));
    }, 90);
  };

  const stop = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (barsRef.current) clearInterval(barsRef.current);
    setState("done");
    setBars(Array(24).fill(12));
  };

  const cancel = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (barsRef.current) clearInterval(barsRef.current);
    setState("idle");
    setSeconds(0);
    setBars(Array(24).fill(4));
    onDone(null);
  };

  const confirm = () => {
    onDone(seconds);
  };

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 rounded-xl p-3"
      style={{
        background: "var(--bg-secondary)",
        border: "1px solid var(--border-glass)",
      }}
    >
      <motion.button
        onClick={state === "idle" ? start : state === "recording" ? stop : cancel}
        whileTap={{ scale: 0.92 }}
        className={
          state === "recording"
            ? "community-recording-ring w-11 h-11 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0"
            : "w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
        }
        style={state !== "recording" ? { background: "var(--brand-soft)" } : {}}
      >
        {state === "recording" ? (
          <Square size={14} className="text-white" weight="fill" />
        ) : state === "done" ? (
          <Trash size={16} style={{ color: "var(--brand)" }} />
        ) : (
          <Microphone size={16} style={{ color: "var(--brand)" }} />
        )}
      </motion.button>

      <div className="flex-1 flex items-center gap-1">
        {state === "recording" ? (
          bars.map((h, i) => (
            <div key={i} className="community-wave-bar flex-1" style={{ height: h }} />
          ))
        ) : (
          <span className="text-sm" style={{ color: "var(--text-muted)" }}>
            {state === "done" ? "Recording complete" : "Tap to record"}
          </span>
        )}
      </div>

      {state === "recording" && (
        <span className="text-sm font-medium tabular-nums flex-shrink-0" style={{ color: "#ef4444" }}>
          {fmt(seconds)}
        </span>
      )}

      {state === "done" && (
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={confirm}
          className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: "var(--brand)" }}
        >
          <Check size={18} weight="bold" className="text-white" />
        </motion.button>
      )}
    </motion.div>
  );
}
