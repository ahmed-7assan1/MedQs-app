"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Trophy, Star } from "lucide-react";
import { cn } from "@/lib/utils";

const COLORS = ["#f43f5e", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#a855f7"];
const SHAPES = ["square", "circle", "triangle"];

interface ConfettiPiece {
  id: number;
  x: number;
  color: string;
  shape: string;
  size: number;
  delay: number;
}

const createPieces = (count: number): ConfettiPiece[] =>
  Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
    size: 6 + Math.random() * 8,
    delay: Math.random() * 0.5,
  }));

const MILESTONES = [3, 7, 14, 21, 30, 60, 90, 180, 365];

export const StreakCelebration = ({ currentStreak }: { currentStreak: number }) => {
  const [celebrated, setCelebrated] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem("streak-milestones");
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);
  const [show, setShow] = useState(false);

  const saveMilestones = useCallback((arr: number[]) => {
    setCelebrated(arr);
    try { localStorage.setItem("streak-milestones", JSON.stringify(arr)); } catch {}
  }, []);

  const trigger = useCallback((streak: number) => {
    setPieces(createPieces(40));
    setShow(true);
    setTimeout(() => setShow(false), 3500);
    saveMilestones([...celebrated, streak]);
  }, [celebrated, saveMilestones]);

  useEffect(() => {
    if (currentStreak < 1) return;
    if (celebrated.includes(currentStreak)) return;
    const isMilestone = MILESTONES.includes(currentStreak);
    if (isMilestone) trigger(currentStreak);
  }, [currentStreak, celebrated, trigger]);

  const nextMilestone = MILESTONES.find((m) => m > currentStreak);
  const progress = nextMilestone ? (currentStreak / nextMilestone) * 100 : 100;

  let emoji: { icon: typeof Flame; label: string; color: string };
  if (currentStreak >= 30) emoji = { icon: Trophy, label: "Legendary", color: "text-amber-500" };
  else if (currentStreak >= 7) emoji = { icon: Star, label: "On Fire", color: "text-orange-500" };
  else emoji = { icon: Flame, label: "Streak", color: "text-rose-500" };

  const Icon = emoji.icon;

  return (
    <>
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 pointer-events-none z-50"
          >
            {pieces.map((p) => (
              <motion.div
                key={p.id}
                initial={{ y: -20, x: `${p.x}vw`, opacity: 1, rotate: 0 }}
                animate={{ y: "100vh", opacity: 0, rotate: 720 }}
                transition={{ duration: 2.5 + p.delay, ease: "easeIn" }}
                className="confetti-piece"
                style={{
                  left: `${p.x}%`,
                  width: p.size,
                  height: p.size,
                  background: p.color,
                  borderRadius: p.shape === "circle" ? "50%" : p.shape === "triangle" ? "0" : "2px",
                  clipPath: p.shape === "triangle" ? "polygon(50% 0%, 0% 100%, 100% 100%)" : undefined,
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="dash-sidebar-card">
        <div className="flex items-center gap-3">
          <div className={cn("p-2 rounded-xl", currentStreak >= 30 ? "bg-amber-500/20" : currentStreak >= 7 ? "bg-orange-500/20" : "bg-rose-500/20")}>
            <Icon size={18} className={emoji.color} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-lg font-black text-foreground tabular-nums">{currentStreak} day{currentStreak !== 1 ? "s" : ""}</p>
            <p className="text-[10px] font-bold text-foreground/40 uppercase tracking-wider">{emoji.label}</p>
          </div>
        </div>
        {nextMilestone && (
          <div className="mt-3">
            <div className="flex justify-between text-[9px] font-bold text-foreground/30 mb-1">
              <span>Next: {nextMilestone}d</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1 }}
                className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
              />
            </div>
          </div>
        )}
      </div>
    </>
  );
};
