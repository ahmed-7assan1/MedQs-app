"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

function Shimmer({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={cn("ss-focus-shimmer rounded-md", className)} style={style} />;
}

function WidgetSkeleton({ className, delayMs = 0 }: { className: string; delayMs?: number }) {
  return (
    <div
      className={cn(
        "absolute overflow-hidden rounded-2xl border border-white/[0.07] bg-[rgba(15,17,23,0.88)] shadow-[0_8px_32px_rgba(0,0,0,0.35)] backdrop-blur-xl",
        "motion-safe:animate-[ss-focus-widget-in_0.5s_cubic-bezier(0.34,1.2,0.64,1)_both]",
        className
      )}
      style={{ animationDelay: `${delayMs}ms` }}
    >
      <div className="flex items-center gap-2 border-b border-white/[0.05] bg-white/[0.02] px-3.5 py-2.5">
        <Shimmer className="h-3.5 w-3.5 rounded" />
        <Shimmer className="h-2.5 w-[4.5rem]" />
        <div className="ml-auto flex gap-1.5">
          <Shimmer className="h-[18px] w-[18px] rounded-md" />
          <Shimmer className="h-[18px] w-[18px] rounded-md" />
        </div>
      </div>
      <div className="flex flex-col gap-2.5 px-4 py-3.5">
        <Shimmer className="h-2.5 w-[80%]" />
        <Shimmer className="h-2.5 w-[58%]" />
        <Shimmer className="h-2.5 w-[72%]" />
        <Shimmer className="mt-1.5 h-10 w-full rounded-xl" />
        <Shimmer className="h-2.5 w-[45%]" />
      </div>
    </div>
  );
}

/**
 * Full-viewport loading UI for /space — matches the focus-desk widget board metaphor.
 */
export function SpaceFocusLoading() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const t = requestAnimationFrame(() => setShow(true));
    return () => cancelAnimationFrame(t);
  }, []);

  return (
    <div
      className={cn(
        "flex h-[100dvh] flex-col overflow-hidden bg-[#090a0e] text-white transition-opacity duration-200",
        show ? "opacity-100" : "opacity-0"
      )}
      aria-busy="true"
      aria-label="Loading study desk"
    >
      <div
        className="flex shrink-0 items-center gap-2.5 border-b border-white/[0.06] bg-[rgba(9,10,14,0.96)] px-4 py-2.5 motion-safe:animate-[ss-focus-bar-in_0.3s_ease_both]"
      >
        <Shimmer className="h-4 w-24 rounded-md" />
        <div className="mx-0.5 h-[18px] w-px bg-white/[0.08]" />
        <Shimmer className="h-8 w-28 rounded-xl" />
        <Shimmer className="h-8 w-20 rounded-xl" />
        <Shimmer className="h-8 w-16 rounded-xl" />
        <div className="flex-1" />
        <Shimmer className="h-8 w-8 rounded-xl" />
      </div>

      <div
        className="relative min-h-0 flex-1 overflow-hidden"
        style={{
          backgroundImage: `
            repeating-linear-gradient(0deg, rgba(255,255,255,0.022) 0px, rgba(255,255,255,0.022) 1px, transparent 1px, transparent 32px),
            repeating-linear-gradient(90deg, rgba(255,255,255,0.022) 0px, rgba(255,255,255,0.022) 1px, transparent 1px, transparent 32px)
          `,
          backgroundSize: "32px 32px",
        }}
      >
        <WidgetSkeleton
          className="left-[4.5rem] top-14 h-[250px] w-[218px] max-[480px]:left-4 max-[480px]:top-10 max-[480px]:w-[200px]"
          delayMs={80}
        />
        <WidgetSkeleton
          className="left-[min(330px,22vw)] top-[4.5rem] z-[1] h-[290px] w-[258px] max-md:hidden"
          delayMs={160}
        />
        <WidgetSkeleton
          className="right-[min(120px,8vw)] top-11 z-[1] h-[210px] w-[236px] max-lg:hidden"
          delayMs={240}
        />
        <WidgetSkeleton
          className="bottom-[min(180px,22vh)] left-[6%] h-[188px] w-[242px] max-md:left-3 max-md:bottom-24"
          delayMs={320}
        />
        <WidgetSkeleton
          className="bottom-[min(120px,16vh)] right-[min(100px,10vw)] h-[164px] w-[274px] max-md:hidden"
          delayMs={400}
        />

        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_38%_38%,rgba(59,130,246,0.09)_0%,transparent_58%)]"
          aria-hidden
        />

        <div className="pointer-events-none absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-3 select-none">
          <div className="flex gap-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-[7px] w-[7px] rounded-full bg-blue-500/80 motion-safe:animate-[ss-focus-dot_1.2s_ease-in-out_infinite]"
                style={{ animationDelay: `${i * 0.18}s` }}
              />
            ))}
          </div>
          <p className="m-0 text-[11.5px] font-medium tracking-[0.06em] text-white/30">
            Loading your desk…
          </p>
        </div>
      </div>
    </div>
  );
}
