"use client";

import { Trophy, Star } from "@phosphor-icons/react";

interface LeaderboardEntry {
  id: string;
  name: string;
  image?: string;
  points: number;
  rank?: { label: string; badge?: string } | null;
}

interface Props {
  entries: LeaderboardEntry[];
  currentUserId: string;
}

export default function SessionLeaderboard({ entries, currentUserId }: Props) {
  const sorted = [...entries].sort((a, b) => b.points - a.points);

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="space-y-2">
      {sorted.length === 0 && (
        <p className="text-center text-gray-400 text-sm py-4">No participants yet</p>
      )}
      {sorted.map((entry, idx) => {
        const isMe = entry.id === currentUserId;
        const medal = idx < 3 ? medals[idx] : null;

        return (
          <div
            key={entry.id}
            className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
              isMe ? "bg-blue-50 border-blue-200" : "bg-white border-gray-100"
            }`}
          >
            <div className="w-7 text-center text-lg font-bold">
              {medal ?? <span className="text-sm text-gray-400">{idx + 1}</span>}
            </div>
            {entry.image ? (
              <img src={entry.image} alt="" className="w-9 h-9 rounded-full object-cover" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-sm font-bold text-gray-600">
                {entry.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-800 truncate">{entry.name}</span>
                {entry.rank?.badge && <span className="text-xs">{entry.rank.badge}</span>}
              </div>
            </div>
            <div className="flex items-center gap-1 text-sm font-bold text-yellow-600">
              <Star size={14} weight="fill" />
              {entry.points}
            </div>
          </div>
        );
      })}
    </div>
  );
}
