"use client";

import { useThemeStore } from "@/lib/store";
import { THEMES } from "@/lib/themes";
import { cn } from "@/lib/utils";

interface ThemeVariantPickerProps {
  compact?: boolean;
  onSelect?: () => void;
}

export function ThemeVariantPicker({ compact, onSelect }: ThemeVariantPickerProps) {
  const themeVariant = useThemeStore((s) => s.themeVariant);
  const setThemeVariant = useThemeStore((s) => s.setThemeVariant);

  const handleSelect = (id: typeof themeVariant) => {
    setThemeVariant(id);
    onSelect?.();
  };

  return (
    <div className={cn("grid gap-2", compact ? "grid-cols-4" : "grid-cols-3 sm:grid-cols-4")}>
      {THEMES.map((t) => {
        const active = themeVariant === t.id;
        return (
          <button
            key={t.id}
            onClick={() => handleSelect(t.id)}
            className={cn(
              "flex flex-col items-center gap-1.5 rounded-xl p-2 transition-all active:scale-95",
              active
                ? "bg-primary/10 ring-2 ring-primary ring-offset-2 ring-offset-background"
                : "hover:bg-muted/50"
            )}
          >
            <div
              className="h-8 w-full rounded-lg border border-border"
              style={{ backgroundColor: t.primary }}
            />
            <span
              className={cn(
                "text-[10px] font-semibold leading-tight text-center",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              {t.labelAr}
            </span>
          </button>
        );
      })}
    </div>
  );
}
