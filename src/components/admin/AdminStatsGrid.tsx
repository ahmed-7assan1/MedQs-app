import {
  Users, HelpCircle, Video, FileText, MessageSquare, TrendingUp,
} from "lucide-react";

interface StatCard {
  label: string;
  value: number;
  icon: typeof Users;
  color: string;
  bg: string;
  border: string;
  trend: string;
}

export function AdminStatsGrid({ stats }: { stats: StatCard[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {stats.map(({ label, value, icon: Icon, color, bg, border, trend }) => (
        <div
          key={label}
          className={`relative overflow-hidden rounded-2xl border-l-4 ${border} border border-white/[0.02] bg-gradient-to-br ${bg} p-4`}
        >
          <div className={`mb-2 inline-flex rounded-xl p-2 bg-background/60 ${color}`}>
            <Icon className="h-4 w-4" />
          </div>
          <p className={`font-display text-2xl font-bold ${color}`}>{value.toLocaleString()}</p>
          <p className="text-xs font-semibold text-foreground/80">{label}</p>
          <p className="mt-0.5 text-[10px] text-muted-foreground">{trend}</p>
        </div>
      ))}
    </div>
  );
}
