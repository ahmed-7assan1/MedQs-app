import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export { CardContent, CardDescription, CardFooter, CardHeader, CardTitle };

/** Premium study surface — AMBOSS / UWorld–style card, powered by shadcn/ui Card */
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
  const padClass =
    padding === "none" ? "p-0" :
    padding === "sm" ? "p-4" :
    padding === "lg" ? "p-6 md:p-10" :
    "p-4 md:p-8";

  return (
    <Card
      className={cn(
        "medqs-card rounded-2xl border-[hsl(var(--border)/0.85)] bg-[hsl(var(--card))]",
        "shadow-[0_1px_0_rgb(0_0_0/0.04),0_4px_24px_rgb(0_0_0/0.06)]",
        "dark:shadow-[0_1px_0_rgb(255_255_255/0.05),0_8px_32px_rgb(0_0_0/0.35)]",
        hover && "transition-all duration-300 spring-hover tap-spring hover:border-primary/30 hover:shadow-xl hover:shadow-primary/[0.08]",
        padClass,
        className
      )}
    >
      {children}
    </Card>
  );
}
