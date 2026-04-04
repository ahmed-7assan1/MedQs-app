import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Premium study surface — AMBOSS / UWorld–style card */
export function MedqsCard({
  children,
  className,
  hover = false,
  padding = "md",
}: {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
}) {
  const pad =
    padding === "none"
      ? ""
      : padding === "sm"
        ? "p-4"
        : padding === "lg"
          ? "p-8"
          : "p-5 md:p-6";

  return (
    <div
      className={cn(
        "rounded-2xl border border-[hsl(var(--border)/0.85)] bg-[hsl(var(--card))] shadow-[0_1px_0_rgb(0_0_0/0.04),0_4px_24px_rgb(0_0_0/0.06)]",
        "dark:shadow-[0_1px_0_rgb(255_255_255/0.05),0_8px_32px_rgb(0_0_0/0.35)]",
        hover && "transition-all duration-200 hover:border-primary/25 hover:shadow-lg hover:shadow-primary/[0.07]",
        pad,
        className
      )}
    >
      {children}
    </div>
  );
}
