"use client";

import { Children, isValidElement } from "react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface MedqsSelectProps {
  value?: string;
  onChange?: (e: { target: { value: string } }) => void;
  className?: string;
  disabled?: boolean;
  children?: React.ReactNode;
  placeholder?: string;
  title?: string;
  required?: boolean;
}

/**
 * Drop-in replacement for <select> — powered by shadcn/ui Select.
 * Accepts <option> children, accessible & keyboard-friendly.
 */
export function MedqsSelect({
  value,
  onChange,
  className,
  disabled,
  children,
  placeholder,
  title,
  required,
}: MedqsSelectProps) {
  const options: { value: string; label: string }[] = [];
  Children.forEach(children, (child) => {
    if (isValidElement(child) && child.type === "option") {
      const props = child.props as { value?: string; children?: React.ReactNode };
      const val = String(props.value ?? "");
      if (val === "") return;
      options.push({
        value: val,
        label: String(props.children ?? val),
      });
    }
  });

  function handleChange(newValue: string) {
    onChange?.({ target: { value: newValue } });
  }

  return (
    <div
      className={cn("relative min-w-0", className)}
      title={title}
      data-required={required}
    >
      <Select value={value} onValueChange={handleChange} disabled={disabled}>
        <SelectTrigger
          className={cn(
            "h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground",
            "shadow-sm transition-all duration-200",
            "hover:border-primary/40 hover:bg-muted/30",
            "focus:ring-2 focus:ring-primary/20",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "dark:bg-card/90"
          )}
        >
          <SelectValue placeholder={placeholder ?? "Select\u2026"} />
        </SelectTrigger>
        <SelectContent
          className={cn(
            "z-[9999] rounded-xl border border-white/[0.02] bg-popover shadow-xl shadow-black/20",
            "backdrop-blur-xl"
          )}
        >
          <div className="max-h-60 overflow-y-auto py-1 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
            {options.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </div>
        </SelectContent>
      </Select>
    </div>
  );
}

export { MedqsSelect as default };