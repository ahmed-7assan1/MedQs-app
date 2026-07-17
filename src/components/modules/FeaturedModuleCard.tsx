import Link from "next/link";
import { Play } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ModuleWithStats } from "./ModulesGrid";

const ACCENTS = [
  { ring: "hover:ring-sky-500/30", dot: "bg-sky-500", text: "text-sky-500", bar: "bg-gradient-to-r from-sky-500 to-cyan-400" },
  { ring: "hover:ring-amber-500/30", dot: "bg-amber-500", text: "text-amber-500", bar: "bg-gradient-to-r from-amber-500 to-orange-400" },
  { ring: "hover:ring-emerald-500/30", dot: "bg-emerald-500", text: "text-emerald-500", bar: "bg-gradient-to-r from-emerald-500 to-teal-400" },
  { ring: "hover:ring-violet-500/30", dot: "bg-violet-500", text: "text-violet-500", bar: "bg-gradient-to-r from-violet-500 to-purple-400" },
];

function getAbbreviation(name: string): string {
  const abbreviation = name
    .split(" ")
    .filter((w) => w.length > 2 && w[0] === w[0].toUpperCase())
    .map((w) => w[0])
    .join("")
    .slice(0, 4);
  return abbreviation || name.slice(0, 3).toUpperCase();
}

interface FeaturedModuleCardProps {
  module: ModuleWithStats;
  index?: number;
}

export default function FeaturedModuleCard({ module, index = 0 }: FeaturedModuleCardProps) {
  const accent = ACCENTS[index % ACCENTS.length];
  const href = `/modules/${module.id}`;

  return (
    <Link href={href} className="block group">
      <div
        className={cn(
          "relative overflow-hidden rounded-3xl p-6 transition-all duration-300",
          "bg-card/70 backdrop-blur-xl ring-1 ring-border/60 shadow-[var(--shadow-card)]",
          accent.ring,
          "hover:shadow-xl hover:-translate-y-1"
        )}
      >
        <div className={cn("pointer-events-none absolute -right-4 -top-4 select-none text-[140px] font-black leading-none opacity-[0.04]", accent.text)}>
          {getAbbreviation(module.name)}
        </div>

        {module.imageUrl && (
          <img
            src={module.imageUrl}
            alt=""
            loading="lazy"
            className="pointer-events-none absolute -right-6 top-1/2 h-[110%] w-auto -translate-y-1/2 object-contain opacity-[0.06] select-none"
          />
        )}

        <div className="relative z-10">
          <div className={cn("mb-3 h-2 w-2 rounded-full", accent.dot)} />

          <h3 className="text-lg font-bold text-foreground">{module.name}</h3>

          <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
            <span className="font-medium">{module.subjectsCount} Subjects</span>
            <span className="h-1 w-1 rounded-full bg-border" />
            <span className="font-medium">{module.lecturesCount} Lectures</span>
            <span className="h-1 w-1 rounded-full bg-border" />
            <span className="font-medium">{module.questionsCount} Questions</span>
          </div>

          <div className="mt-5">
            <div className="mb-1.5 flex items-center justify-between text-[11px]">
              <span className="font-medium text-muted-foreground">Mastery Progress</span>
              <span className={cn("font-bold", accent.text)}>{module.percentage}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={cn("h-full rounded-full transition-all duration-1000", accent.bar)}
                style={{ width: `${module.percentage}%` }}
              />
            </div>
          </div>

          <div className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition group-hover:shadow-md">
            <Play className="h-4 w-4 fill-current" />
            Continue
          </div>
        </div>
      </div>
    </Link>
  );
}
