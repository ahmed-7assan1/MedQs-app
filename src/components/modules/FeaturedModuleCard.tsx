import Link from "next/link";
import { Play } from "lucide-react";
import type { ModuleWithStats } from "./ModulesGrid";

const GRADIENTS = [
  "linear-gradient(135deg, hsl(265 60% 30%), hsl(265 40% 18%))",
  "linear-gradient(135deg, hsl(190 60% 30%), hsl(220 40% 18%))",
  "linear-gradient(135deg, hsl(40 60% 30%), hsl(30 40% 18%))",
  "linear-gradient(135deg, hsl(240 60% 30%), hsl(260 40% 18%))",
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
  const gradient = GRADIENTS[index % GRADIENTS.length];
  const href = `/modules/${module.id}`;

  return (
    <Link href={href} className="block group">
      <div
        className="relative overflow-hidden rounded-3xl p-6 text-white transition hover:shadow-xl hover:-translate-y-0.5"
        style={{ background: gradient, minHeight: 200 }}
      >
        {module.imageUrl && (
          <img
            src={module.imageUrl}
            alt=""
            loading="lazy"
            className="pointer-events-none absolute -right-6 top-1/2 h-[110%] w-auto -translate-y-1/2 object-contain opacity-50 mix-blend-screen select-none"
          />
        )}
        <div className="relative z-10">
          <div className="text-4xl font-bold tracking-tight">{getAbbreviation(module.name)}</div>
          <div className="mt-1 text-sm text-white/80">{module.name}</div>
          <div className="mt-6 flex items-center gap-4 text-xs text-white/70">
            <span>{module.subjectsCount} Subjects</span>
            <span className="h-1 w-1 rounded-full bg-white/30" />
            <span>{module.lecturesCount} Lectures</span>
            <span className="h-1 w-1 rounded-full bg-white/30" />
            <span>{module.questionsCount} Questions</span>
          </div>
          <div className="mt-8">
            <div className="mb-1.5 flex items-center justify-between text-[11px] text-white/70">
              <span>Mastery Progress</span>
              <span>{module.percentage}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/15">
              <div
                className="h-full rounded-full bg-white transition-all duration-1000"
                style={{ width: `${module.percentage}%` }}
              />
            </div>
          </div>
          <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-xs font-medium text-white backdrop-blur ring-1 ring-white/20 transition group-hover:bg-white/25">
            <Play className="h-3.5 w-3.5 fill-current" />
            Continue
          </div>
        </div>
      </div>
    </Link>
  );
}
