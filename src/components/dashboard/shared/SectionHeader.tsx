import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function SectionHeader({
  icon: Icon,
  title,
  right,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  right?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2 mb-4", className)}>
      {Icon && <Icon className="h-3.5 w-3.5 text-primary" />}
      <span className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground">
        {title}
      </span>
      {right && <div className="ml-auto">{right}</div>}
    </div>
  );
}
