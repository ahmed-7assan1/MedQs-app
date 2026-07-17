import Link from "next/link";
import { Play, Bookmark } from "lucide-react";
import { GradientLogo } from "@/components/branding/GradientLogo";

interface HeroSectionProps {
  lastActivityHref?: string | null;
}

export default function HeroSection({
  lastActivityHref,
}: HeroSectionProps) {
  return (
    <div className="relative overflow-hidden rounded-3xl px-8 h-full bg-gradient-to-br from-background via-card/50 to-background shadow-[var(--shadow-card)] ring-1 ring-border/60">
      <div className="relative z-10 h-full flex flex-col justify-center">
        <h1 className="text-5xl font-black tracking-tighter leading-none">
          Medical <span className="text-primary">Library</span>
        </h1>
        <p className="mt-3 text-base text-muted-foreground leading-snug max-w-md">
          Master your curriculum through structured clinical modules.
        </p>
        <div className="mt-6 flex items-center gap-3">
          {lastActivityHref ? (
            <Link
              href={lastActivityHref}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-elevated)] transition hover:opacity-90 active:scale-[0.97]"
            >
              <Play className="h-4 w-4 fill-current" />
              Continue Last Lecture
            </Link>
          ) : (
            <span className="inline-flex items-center gap-2 rounded-xl bg-primary/10 px-6 py-3 text-sm font-semibold text-primary/60">
              <Play className="h-4 w-4 fill-current" />
              Continue Last Lecture
            </span>
          )}
          <button className="grid h-10 w-10 place-items-center rounded-xl bg-card ring-1 ring-border/60 transition hover:bg-accent">
            <Bookmark className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Platform logo */}
      <div className="pointer-events-none absolute right-6 top-1/2 hidden -translate-y-1/2 select-none md:flex items-center justify-center h-[130px] w-[130px]">
        <GradientLogo className="h-[110px] w-[110px]" toColor="hsl(var(--primary))" />
      </div>
    </div>
  );
}
