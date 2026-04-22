"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: "danger" | "warning" | "info";
}

export function ConfirmationModal({
  isOpen,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  variant = "danger",
}: ConfirmationModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (isOpen) setMounted(true);
    else {
      const timer = setTimeout(() => setMounted(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!mounted) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-[9999] flex items-center justify-center p-4 transition-all duration-300",
        isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      )}
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-[4px]" 
        onClick={onCancel}
      />

      {/* Modal Content */}
      <div
        className={cn(
          "relative w-full max-w-md overflow-hidden rounded-[24px] border border-black/5 dark:border-white/[0.03] bg-card/95 dark:bg-[#16161a]/95 p-6 shadow-2xl transition-all duration-300 transform",
          isOpen ? "scale-100 opacity-100 translate-y-0" : "scale-95 opacity-0 translate-y-4"
        )}
      >
        {/* Glow Effect */}
        <div 
          className={cn(
            "absolute -top-24 -left-24 h-48 w-48 rounded-full blur-[80px] opacity-[0.08] dark:opacity-20",
            variant === "danger" ? "bg-red-500" : variant === "warning" ? "bg-amber-500" : "bg-blue-500"
          )} 
        />

        {/* Close Button */}
        <button
          onClick={onCancel}
          className="absolute right-4 top-4 rounded-full p-1.5 text-muted-foreground/40 hover:bg-muted dark:hover:bg-white/5 hover:text-foreground transition-all"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex flex-col items-center text-center">
          {/* Icon */}
          <div
            className={cn(
              "mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ring-1",
              variant === "danger" 
                ? "bg-red-500/10 text-red-500 ring-red-500/20" 
                : variant === "warning" 
                ? "bg-amber-500/10 text-amber-500 ring-amber-500/20" 
                : "bg-blue-500/10 text-blue-500 ring-blue-500/20"
            )}
          >
            {variant === "danger" ? (
              <Trash2 className="h-6 w-6 animate-pulse" />
            ) : (
              <AlertCircle className="h-6 w-6" />
            )}
          </div>

          {/* Text */}
          <h3 className="mb-2 text-xl font-bold text-foreground tracking-tight">
            {title}
          </h3>
          <p className="mb-8 text-sm leading-relaxed text-muted-foreground dark:text-white/50">
            {message}
          </p>

          {/* Actions */}
          <div className="flex w-full flex-col-reverse gap-3 sm:flex-row sm:justify-center">
            <button
              onClick={onCancel}
              className="flex-1 rounded-xl px-4 py-3 text-sm font-semibold text-muted-foreground dark:text-white/70 hover:bg-muted dark:hover:bg-white/5 hover:text-foreground transition-all"
            >
              {cancelLabel}
            </button>
            <button
              onClick={onConfirm}
              className={cn(
                "flex-1 rounded-xl px-4 py-3 text-sm font-bold text-white shadow-lg transition-all active:scale-95",
                variant === "danger" 
                  ? "bg-red-500 hover:bg-red-600 shadow-red-500/20" 
                  : variant === "warning" 
                  ? "bg-amber-500 hover:bg-amber-600 shadow-amber-500/20" 
                  : "bg-blue-500 hover:bg-blue-600 shadow-blue-500/20"
              )}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

