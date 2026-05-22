"use client";

import { useState, useEffect } from "react";
import { Clock, User, Star, XCircle, BookOpen } from "@phosphor-icons/react";

interface HistorySession {
  id: string;
  startedAt: string;
  endedAt: string | null;
  targetDuration: number;
  status: string;
  lectureTitle: string | null;
  totalPointsAwarded: number;
  startedBy: { id: string; name: string; image?: string };
  participants: Array<{
    userId: string;
    focusSeconds: number;
    sessionsCompleted: number;
    user: { id: string; name: string; image?: string };
  }>;
}

interface Props {
  roomId: string;
}

export default function SessionHistory({ roomId }: Props) {
  const [history, setHistory] = useState<HistorySession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/v1/rooms/${roomId}/sessions/history`)
      .then((r) => r.json())
      .then((data) => setHistory(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [roomId]);

  if (loading) {
    return <p className="text-center text-gray-400 text-sm py-8">Loading history...</p>;
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-10">
        <Clock size={40} className="mx-auto text-gray-300 mb-3" />
        <p className="text-sm text-gray-500">No completed sessions yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {history.map((s) => {
        const started = new Date(s.startedAt);
        const durationMin = s.endedAt
          ? Math.round((new Date(s.endedAt).getTime() - started.getTime()) / 60000)
          : s.targetDuration;
        const avgFocus = s.participants.length > 0
          ? Math.round(s.participants.reduce((a, p) => a + p.focusSeconds, 0) / s.participants.length / 60)
          : 0;

        return (
          <div
            key={s.id}
            className="bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10 p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center">
                  {s.startedBy.image ? (
                    <img src={s.startedBy.image} alt="" className="w-7 h-7 rounded-full object-cover" />
                  ) : (
                    <span className="text-[10px] font-bold">{s.startedBy.name.charAt(0)}</span>
                  )}
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">{s.startedBy.name}</p>
                  <p className="text-[10px] text-gray-500">
                    {started.toLocaleDateString()} · {started.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                s.status === "COMPLETED"
                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
              }`}>
                {s.status === "COMPLETED" ? "Completed" : "Cancelled"}
              </span>
            </div>

            {s.lectureTitle && (
              <div className="flex items-center gap-1.5 mb-2 text-xs text-blue-600 dark:text-blue-400">
                <BookOpen size={12} />
                <span className="truncate">{s.lectureTitle}</span>
              </div>
            )}

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-gray-50 dark:bg-white/5 rounded-xl py-2">
                <p className="text-lg font-bold text-gray-800 dark:text-gray-200">{durationMin}m</p>
                <p className="text-[9px] text-gray-500 uppercase tracking-wider">Duration</p>
              </div>
              <div className="bg-gray-50 dark:bg-white/5 rounded-xl py-2">
                <p className="text-lg font-bold text-gray-800 dark:text-gray-200">{s.participants.length}</p>
                <p className="text-[9px] text-gray-500 uppercase tracking-wider">Studied</p>
              </div>
              <div className="bg-gray-50 dark:bg-white/5 rounded-xl py-2">
                <p className="text-lg font-bold text-amber-600">{s.totalPointsAwarded}</p>
                <p className="text-[9px] text-gray-500 uppercase tracking-wider">Points</p>
              </div>
            </div>

            {s.participants.length > 0 && (
              <div className="mt-3 flex items-center gap-1.5 text-[10px] text-gray-500">
                <User size={10} />
                <span>{s.participants.map((p) => p.user.name).join(", ")}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
