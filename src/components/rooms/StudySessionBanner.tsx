"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Play, Pause, Stop, Clock, Users, BookOpen,
} from "@phosphor-icons/react";

interface Props {
  roomId: string;
  userId: string;
  isHost: boolean;
  timerState: {
    sessionId: string;
    status: "WAITING" | "ACTIVE" | "PAUSED" | "COMPLETED" | "CANCELLED";
    startedAt: number | null;
    pausedAt: number | null;
    totalPauseMs: number;
    targetDuration: number;
    serverNow: number;
  } | null;
  participantCount: number;
  lectureTitle?: string | null;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onComplete: () => void;
  onCancel: () => void;
}

export default function StudySessionBanner({
  timerState,
  isHost,
  participantCount,
  lectureTitle,
  onStart, onPause, onResume, onComplete, onCancel,
}: Props) {
  const [elapsedSec, setElapsedSec] = useState(0);

  const calcElapsed = useCallback(() => {
    if (!timerState || timerState.status === "WAITING" || timerState.status === "CANCELLED" || timerState.status === "COMPLETED") return 0;
    if (!timerState.startedAt) return 0;
    const now = timerState.serverNow ? Date.now() + (Date.now() - timerState.serverNow) : Date.now();
    let elapsed = now - timerState.startedAt - timerState.totalPauseMs;
    if (timerState.pausedAt) {
      elapsed -= now - timerState.pausedAt;
    }
    return Math.max(0, Math.floor(elapsed / 1000));
  }, [timerState]);

  useEffect(() => {
    if (!timerState || timerState.status !== "ACTIVE") {
      setElapsedSec(calcElapsed());
      return;
    }
    setElapsedSec(calcElapsed());
    const interval = setInterval(() => {
      setElapsedSec((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timerState, calcElapsed]);

  const totalSec = (timerState?.targetDuration ?? 25) * 60;
  const remaining = Math.max(0, totalSec - elapsedSec);
  const progress = totalSec > 0 ? elapsedSec / totalSec : 0;

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  if (!timerState || timerState.status === "CANCELLED" || timerState.status === "COMPLETED") {
    return null;
  }

  const isWaiting = timerState.status === "WAITING";

  return (
    <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock size={24} weight="fill" />
          <h2 className="text-lg font-bold">Study Session</h2>
        </div>
        <div className="flex items-center gap-1 text-sm opacity-80">
          <Users size={16} />
          <span>{participantCount} studying</span>
        </div>
      </div>

      {lectureTitle && (
        <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-white/10 rounded-xl">
          <BookOpen size={16} weight="fill" />
          <span className="text-sm font-medium truncate">{lectureTitle}</span>
        </div>
      )}

      <div className="text-center mb-4">
        <div className="text-5xl md:text-5xl text-4xl font-mono font-bold tracking-wider mb-1">
          {isWaiting ? fmt(totalSec) : fmt(remaining)}
        </div>
        <div className="text-sm opacity-70">
          {isWaiting ? "Ready to start" : timerState.status === "PAUSED" ? "Paused" : `${Math.round(progress * 100)}% complete`}
        </div>
      </div>

      <div className="w-full bg-white/20 rounded-full h-2 mb-4">
        <div
          className="bg-white rounded-full h-2 transition-all duration-500"
          style={{ width: `${Math.min(progress * 100, 100)}%` }}
        />
      </div>

      {isHost && (
        <div className="flex justify-center gap-3">
          {isWaiting && (
            <button
              onClick={onStart}
              className="flex items-center gap-2 px-6 py-2 bg-white text-blue-700 rounded-xl font-semibold hover:bg-blue-50 transition-colors"
            >
              <Play size={20} weight="fill" />
              Start
            </button>
          )}
          {timerState.status === "ACTIVE" && (
            <>
              <button
                onClick={onPause}
                className="flex items-center gap-2 px-6 py-2 bg-yellow-500 text-white rounded-xl font-semibold hover:bg-yellow-600 transition-colors"
              >
                <Pause size={20} weight="fill" />
                Pause
              </button>
              <button
                onClick={onComplete}
                className="flex items-center gap-2 px-6 py-2 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-600 transition-colors"
              >
                <Stop size={20} weight="fill" />
                Complete
              </button>
            </>
          )}
          {timerState.status === "PAUSED" && (
            <>
              <button
                onClick={onResume}
                className="flex items-center gap-2 px-6 py-2 bg-white text-blue-700 rounded-xl font-semibold hover:bg-blue-50 transition-colors"
              >
                <Play size={20} weight="fill" />
                Resume
              </button>
              <button
                onClick={onComplete}
                className="flex items-center gap-2 px-6 py-2 bg-green-500 rounded-xl font-semibold hover:bg-green-600 transition-colors"
              >
                <Stop size={20} weight="fill" />
                Complete
              </button>
            </>
          )}
          {(isWaiting || timerState.status === "PAUSED") && (
            <button
              onClick={onCancel}
              className="flex items-center gap-2 px-6 py-2 bg-red-500/80 text-white rounded-xl font-semibold hover:bg-red-600 transition-colors text-sm"
            >
              Cancel
            </button>
          )}
        </div>
      )}
    </div>
  );
}
