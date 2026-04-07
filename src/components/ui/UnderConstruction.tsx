"use client";

import Link from "next/link";
import { Wrench, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export function UnderConstruction({
  title = "Under construction",
  message = "We’re building this area now. Check back soon.",
  backHref = "/dashboard-app",
  backLabel = "Back to dashboard",
  className,
}: {
  title?: string;
  message?: string;
  backHref?: string;
  backLabel?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex min-h-[60vh] items-center justify-center px-4", className)}>
      <div className="w-full max-w-lg rounded-3xl border border-border bg-card/70 p-6 text-center shadow-sm backdrop-blur md:p-8">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Wrench className="h-6 w-6" />
        </div>
        <p className="mt-4 font-display text-2xl font-bold tracking-tight text-foreground">{title}</p>
        <p className="mx-auto mt-2 max-w-prose text-sm leading-relaxed text-muted-foreground">{message}</p>
        <div className="mt-6 flex justify-center">
          <Link
            href={backHref}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            <ArrowLeft className="h-4 w-4" />
            {backLabel}
          </Link>
        </div>
      </div>
    </div>
  );
}

