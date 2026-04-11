import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function V2Shell({
  title,
  subtitle,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <main className={cn("mx-auto w-full max-w-7xl px-4 py-8 md:px-8 md:py-10", className)}>
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{title}</h1>
        {subtitle ? <p className="mt-2 text-slate-600 dark:text-slate-300">{subtitle}</p> : null}
      </header>
      {children}
    </main>
  );
}
