"use client";

import { forwardRef } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Site-styled native &lt;select&gt; (no OS/Google-looking dropdown chrome).
 */
export const MedqsSelect = forwardRef<HTMLSelectElement, React.ComponentPropsWithoutRef<"select">>(
  function MedqsSelect({ className, children, disabled, ...props }, ref) {
    return (
      <div className="relative min-w-0">
        <select
          ref={ref}
          disabled={disabled}
          className={cn(
            "h-10 w-full min-w-0 cursor-pointer appearance-none rounded-lg border border-border bg-background py-2 pl-3 pr-9 text-sm text-foreground",
            "shadow-sm transition-[border-color,box-shadow,background-color]",
            "hover:border-primary/25",
            "focus-visible:border-primary/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            "disabled:cursor-not-allowed disabled:opacity-55",
            "dark:bg-card/90",
            className
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
      </div>
    );
  }
);
