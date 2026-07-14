import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function SectionHeader({
  icon: Icon,
  title,
  right,
  className,
  hideSeparator,
}: {
  icon?: LucideIcon;
  title: string;
  right?: React.ReactNode;
  className?: string;
  hideSeparator?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-2.5 mb-5 group", className)}>
      {Icon && (
        <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-primary/10 text-primary shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:bg-primary/15">
          <Icon className="h-3 w-3" />
        </div>
      )}
      <span className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/80">
        {title}
      </span>
      {!hideSeparator && <div className="flex-1 h-px bg-gradient-to-r from-border/60 to-transparent ml-1" />}
      {right && <div className="ml-auto">{right}</div>}
    </div>
  );
}
