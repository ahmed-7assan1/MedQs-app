import {
  Play,
  Bookmark,
  CheckCircle2,
  Download,
  History,
} from "lucide-react";

const actions = [
  { icon: Play, title: "Continue", sub: "Pick up where you left off", color: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400" },
  { icon: Bookmark, title: "Bookmarks", sub: "Your saved lectures", color: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" },
  { icon: CheckCircle2, title: "Completed", sub: "Lectures you finished", color: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" },
  { icon: Download, title: "Downloads", sub: "Lectures for offline", color: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" },
  { icon: History, title: "Recent", sub: "Recently opened", color: "bg-slate-100 text-slate-600 dark:bg-slate-800/40 dark:text-slate-400" },
];

export default function QuickActions() {
  return (
    <section className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
      {actions.map((a) => {
        const Icon = a.icon;
        return (
          <button
            key={a.title}
            className="flex items-center gap-3 rounded-2xl bg-card p-4 text-left shadow-[var(--shadow-card)] ring-1 ring-border/60 transition hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.98]"
          >
            <div className={`grid h-11 w-11 place-items-center rounded-full shrink-0 ${a.color}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold">{a.title}</div>
              <div className="truncate text-xs text-muted-foreground">{a.sub}</div>
            </div>
          </button>
        );
      })}
    </section>
  );
}