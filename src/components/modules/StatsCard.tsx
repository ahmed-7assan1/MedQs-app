import { Package, BookOpen, ListChecks, TrendingUp } from "lucide-react";

interface StatsCardProps {
  totalModules: number;
  totalLectures: number;
  totalQuestions: number;
  completionPercent: number;
}

const statConfig = [
  { label: "Modules", icon: Package, color: "text-sky-500", bg: "bg-sky-500/10" },
  { label: "Lectures", icon: BookOpen, color: "text-amber-500", bg: "bg-amber-500/10" },
  { label: "Questions", icon: ListChecks, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  { label: "Progress", icon: TrendingUp, color: "text-primary", bg: "bg-primary/10" },
];

export default function StatsCard({
  totalModules,
  totalLectures,
  totalQuestions,
  completionPercent,
}: StatsCardProps) {
  const values = [totalModules, totalLectures, totalQuestions, `${completionPercent}%`];

  return (
    <div className="rounded-3xl bg-gradient-to-br from-card to-background p-4 shadow-[var(--shadow-card)] ring-1 ring-border/60">
      <div className="grid grid-cols-2 gap-2">
        {statConfig.map((s, i) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className="rounded-xl bg-card/60 p-3 ring-1 ring-border/40 transition hover:ring-primary/30"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {s.label}
                </span>
                <div className={`grid h-6 w-6 place-items-center rounded-lg ${s.bg}`}>
                  <Icon className={`h-3 w-3 ${s.color}`} />
                </div>
              </div>
              <div className="mt-1.5 text-xl font-bold tracking-tight">{values[i]}</div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 rounded-xl bg-card/40 p-3 ring-1 ring-border/40">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold text-muted-foreground">Overall Completion</span>
          <span className="text-xs font-bold text-primary">{completionPercent}%</span>
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-cyan-400 transition-all duration-1000"
            style={{ width: `${completionPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
