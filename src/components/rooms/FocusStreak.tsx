"use client";

import { Fire, CalendarCheck } from "@phosphor-icons/react";

interface Props {
  currentStreak: number;
  longestStreak: number;
  sessionsThisWeek: number;
}

export default function FocusStreak({ currentStreak, longestStreak, sessionsThisWeek }: Props) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-xl p-4 text-white text-center">
        <Fire size={24} weight="fill" className="mx-auto mb-1" />
        <div className="text-2xl font-bold">{currentStreak}</div>
        <div className="text-[10px] opacity-80">Day Streak</div>
      </div>
      <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl p-4 text-white text-center">
        <Fire size={24} weight="fill" className="mx-auto mb-1" />
        <div className="text-2xl font-bold">{longestStreak}</div>
        <div className="text-[10px] opacity-80">Best Streak</div>
      </div>
      <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-4 text-white text-center">
        <CalendarCheck size={24} weight="fill" className="mx-auto mb-1" />
        <div className="text-2xl font-bold">{sessionsThisWeek}</div>
        <div className="text-[10px] opacity-80">This Week</div>
      </div>
    </div>
  );
}
