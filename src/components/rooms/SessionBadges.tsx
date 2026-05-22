"use client";

import { useState, useEffect } from "react";

interface BadgeInfo {
  id: string;
  label: string;
  description: string;
  icon: string;
  earned: boolean;
  progress: { earned: boolean; progress?: { current: number; target: number } };
}

interface Props {
  roomId: string;
}

export default function SessionBadges({ roomId }: Props) {
  const [badges, setBadges] = useState<BadgeInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/v1/rooms/${roomId}/badges`)
      .then((r) => r.json())
      .then((data) => setBadges(Array.isArray(data.badges) ? data.badges : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [roomId]);

  if (loading) {
    return <p className="text-center text-gray-400 text-sm py-4">Loading badges...</p>;
  }

  const earned = badges.filter((b) => b.earned);
  const locked = badges.filter((b) => !b.earned);

  return (
    <div className="space-y-4">
      {earned.length > 0 && (
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3">Earned ({earned.length}/{badges.length})</p>
          <div className="flex flex-wrap gap-2">
            {earned.map((b) => (
              <div
                key={b.id}
                title={`${b.label}: ${b.description}`}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-lg bg-gradient-to-br from-amber-400 to-yellow-500 shadow-lg shadow-amber-500/30 ring-2 ring-amber-300"
              >
                {b.icon}
              </div>
            ))}
          </div>
        </div>
      )}

      {locked.length > 0 && (
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Locked</p>
          <div className="space-y-2">
            {locked.map((b) => (
              <div key={b.id} className="flex items-center gap-3 px-3 py-2 bg-gray-50 dark:bg-white/5 rounded-xl">
                <div className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-base opacity-50">
                  {b.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 truncate">{b.label}</p>
                  <p className="text-[10px] text-gray-400 truncate">{b.description}</p>
                </div>
                {b.progress.progress && (
                  <div className="text-right flex-shrink-0">
                    <p className="text-[10px] font-bold text-gray-500">
                      {b.progress.progress.current}/{b.progress.progress.target}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
