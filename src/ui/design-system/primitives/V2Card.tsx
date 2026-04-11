import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function V2Card({
  children,
  className,
  hover = false,
}: {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_10px_26px_rgba(15,23,42,0.08)] transition-transform duration-200 dark:border-slate-800 dark:bg-slate-900",
        hover && "hover:-translate-y-[1px] hover:shadow-[0_18px_40px_rgba(15,23,42,0.14)]",
        className
      )}
    >
      {children}
    </section>
  );
}
