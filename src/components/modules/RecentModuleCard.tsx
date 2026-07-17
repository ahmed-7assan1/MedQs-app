import Link from "next/link";
import { Bookmark } from "lucide-react";
import type { ModuleWithStats } from "./ModulesGrid";

const SMALL_GRADIENTS = [
  "linear-gradient(135deg, hsl(190 60% 30%), hsl(220 40% 18%))",
  "linear-gradient(135deg, hsl(40 60% 30%), hsl(30 40% 18%))",
  "linear-gradient(135deg, hsl(240 60% 30%), hsl(260 40% 18%))",
  "linear-gradient(135deg, hsl(160 60% 30%), hsl(140 40% 18%))",
];

const BAR_COLORS = [
  "oklch(0.7 0.17 155)",
  "oklch(0.75 0.17 65)",
  "oklch(0.65 0.18 240)",
  "oklch(0.7 0.15 100)",
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

interface RecentModuleCardProps {
  module: ModuleWithStats;
  index?: number;
}

export default function RecentModuleCard({ module, index = 0 }: RecentModuleCardProps) {
  const gradient = SMALL_GRADIENTS[index % SMALL_GRADIENTS.length];
  const barColor = BAR_COLORS[index % BAR_COLORS.length];

  return (
    <Link href={`/modules/${module.id}`} className="block group">
      <div
        className="relative overflow-hidden rounded-3xl p-5 text-white transition hover:shadow-xl hover:-translate-y-0.5"
        style={{ background: gradient, minHeight: 200 }}
      >
        {module.imageUrl && (
          <img
            src={module.imageUrl}
            alt=""
            loading="lazy"
            className="pointer-events-none absolute -right-4 top-1/2 h-[115%] w-auto -translate-y-1/2 object-contain opacity-60 mix-blend-screen select-none"
          />
        )}
        <button className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-full bg-white/10 backdrop-blur ring-1 ring-white/20 transition hover:bg-white/20">
          <Bookmark className="h-3.5 w-3.5" />
        </button>
        <div className="relative z-10">
          <div className="text-2xl font-bold">{getAbbreviation(module.name)}</div>
          <div className="mt-0.5 text-xs text-white/80">{module.name}</div>
          <div className="mt-8 flex items-center gap-3 text-[11px] text-white/70">
            <span>{module.lecturesCount} Lectures</span>
            <span className="h-1 w-1 rounded-full bg-white/30" />
            <span>{module.questionsCount} Questions</span>
          </div>
          <div className="mt-2 flex items-center gap-3">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/15">
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{ width: `${module.percentage}%`, background: barColor }}
              />
            </div>
            <span className="text-[11px] font-semibold">{module.percentage}%</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
