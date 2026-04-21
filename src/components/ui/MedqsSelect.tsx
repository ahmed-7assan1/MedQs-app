"use client";

import { useState, useRef, useEffect, Children, isValidElement } from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface MedqsSelectProps {
  value?: string;
  onChange?: (e: { target: { value: string } }) => void;
  className?: string;
  disabled?: boolean;
  children?: React.ReactNode;
  placeholder?: string;
}

/**
 * Fully custom styled dropdown — no native OS/browser chrome.
 * Drop-in replacement for <select>. Accepts <option> children.
 */
export function MedqsSelect({
  value,
  onChange,
  className,
  disabled,
  children,
  placeholder,
}: MedqsSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Parse <option> children into list items
  const options: { value: string; label: string }[] = [];
  Children.forEach(children, (child) => {
    if (isValidElement(child) && child.type === "option") {
      const props = child.props as { value?: string; children?: React.ReactNode };
      options.push({
        value: String(props.value ?? ""),
        label: String(props.children ?? props.value ?? ""),
      });
    }
  });

  const selected = options.find((o) => o.value === value);

  // Close on outside click
  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  function pick(val: string) {
    onChange?.({ target: { value: val } });
    setOpen(false);
  }

  return (
    <div ref={ref} className={cn("relative min-w-0 select-none", className)}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => !disabled && setOpen((p) => !p)}
        disabled={disabled}
        className={cn(
          "h-10 w-full flex items-center justify-between gap-2 rounded-lg border border-border bg-background px-3 text-sm text-foreground",
          "shadow-sm transition-all duration-200",
          "hover:border-primary/40 hover:bg-muted/30",
          open && "border-primary/50 ring-2 ring-primary/20",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "dark:bg-card/90"
        )}
      >
        <span className={cn("truncate text-left", !selected && "text-muted-foreground")}>
          {selected?.label ?? placeholder ?? "Select…"}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>

      {/* Dropdown Panel */}
      {open && (
        <div
          className={cn(
            "absolute z-[9999] mt-1.5 w-full overflow-hidden",
            "rounded-xl border border-border/60 bg-popover shadow-xl shadow-black/20",
            "backdrop-blur-xl",
            "animate-in fade-in-0 zoom-in-95 slide-in-from-top-1 duration-150"
          )}
        >
          <div className="max-h-60 overflow-y-auto py-1 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
            {options.map((opt) => {
              const isActive = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => pick(opt.value)}
                  className={cn(
                    "w-full flex items-center justify-between gap-3 px-3.5 py-2.5 text-sm text-left transition-colors duration-100",
                    isActive
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-foreground hover:bg-muted/60 hover:text-foreground"
                  )}
                >
                  <span className="truncate">{opt.label}</span>
                  {isActive && <Check className="h-3.5 w-3.5 shrink-0 text-primary" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// Legacy forwardRef export for backward compat with old native <select> usage
export { MedqsSelect as default };
