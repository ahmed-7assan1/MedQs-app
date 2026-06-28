import { TrendingUp } from "lucide-react";

export function AdminSignupsChart({
  dayCounts,
  dayLabels,
  days,
  newUsersThisWeek,
  growthPct,
  maxDay,
}: {
  dayCounts: number[];
  dayLabels: string[];
  days: Date[];
  newUsersThisWeek: number;
  growthPct: number;
  maxDay: number;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.02] bg-card p-5 lg:col-span-1">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">New Students</p>
          <p className="font-display text-2xl font-bold">{newUsersThisWeek}</p>
          <span className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold ${growthPct >= 0 ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"}`}>
            {growthPct >= 0 ? "↑" : "↓"} {Math.abs(growthPct)}% vs prior week
          </span>
        </div>
        <TrendingUp className="h-5 w-5 text-muted-foreground/40" />
      </div>

      <div className="flex items-end gap-1.5 h-20">
        {dayCounts.map((count, i) => {
          const h = Math.max(4, Math.round((count / maxDay) * 100));
          return (
            <div key={i} className="flex flex-1 flex-col items-center gap-1">
              <div
                className="w-full rounded-t-lg bg-gradient-to-t from-blue-600 to-indigo-500 opacity-80 transition-all"
                style={{ height: `${h}%` }}
                title={`${count} users`}
              />
              <span className="text-[9px] text-muted-foreground">
                {dayLabels[days[i].getDay()]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
