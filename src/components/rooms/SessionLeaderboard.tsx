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
        <p className="text-center text-muted-foreground text-sm py-4">No participants yet</p>
      )}
      {sorted.map((entry, idx) => {
        const isMe = entry.id === currentUserId;
        const medal = idx < 3 ? medals[idx] : null;

        return (
          <div
            key={entry.id}
            className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
              isMe ? "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800" : "bg-card border-border"
            }`}
          >
            <div className="w-7 text-center text-lg font-bold">
              {medal ?? <span className="text-sm text-muted-foreground">{idx + 1}</span>}
            </div>
            {entry.image ? (
              <img src={entry.image} alt="" className="w-9 h-9 rounded-full object-cover" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-sm font-bold text-muted-foreground">
                {entry.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-foreground truncate">{entry.name}</span>
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
