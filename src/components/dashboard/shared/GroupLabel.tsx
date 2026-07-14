import { cn } from "@/lib/utils";

export function GroupLabel({ label, className }: { label: string; className?: string }) {
  return (
    <div className={cn("flex items-center gap-4", className)}>
      <div className="flex-1 h-px bg-muted-foreground/15" />
      <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/30 shrink-0">
        {label}
      </span>
      <div className="flex-1 h-px bg-muted-foreground/15" />
    </div>
  );
}
