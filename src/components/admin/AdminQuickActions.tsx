import Link from "next/link";
import { ArrowUpRight, type LucideIcon } from "lucide-react";

interface QuickAction {
  href: string;
  icon: LucideIcon;
  label: string;
  desc: string;
  color: string;
  bg: string;
}

export function AdminQuickActions({
  actions,
  isPlatform,
}: {
  actions: QuickAction[];
  isPlatform: boolean;
}) {
  return (
    <div className={`rounded-2xl border border-white/[0.02] bg-card p-5 ${isPlatform ? "lg:col-span-1" : "lg:col-span-2"}`}>
      <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Quick Actions</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {actions.map(({ href, icon: Icon, label, desc, color, bg }) => (
          <Link key={href} href={href}
            className="group flex flex-col gap-2 rounded-xl border border-white/[0.02] bg-background/60 p-3 transition-all hover:-translate-y-0.5 hover:border-border hover:shadow-md">
            <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${bg}`}>
              <Icon className={`h-4.5 w-4.5 ${color}`} />
            </div>
            <div>
              <p className="text-xs font-semibold leading-tight">{label}</p>
              <p className="mt-0.5 text-[10px] text-muted-foreground leading-snug hidden sm:block">{desc}</p>
            </div>
            <ArrowUpRight className={`h-3.5 w-3.5 ${color} opacity-0 transition-opacity group-hover:opacity-100 mt-auto self-end`} />
          </Link>
        ))}
      </div>
    </div>
  );
}
