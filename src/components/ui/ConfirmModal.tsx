"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
  isLoading?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
  isLoading = false
}: Props) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md overflow-hidden rounded-[32px] bg-[#161523] border border-white/10 shadow-2xl shadow-black/50"
          >
            {/* Header / Icon */}
            <div className={cn(
              "flex flex-col items-center justify-center p-8 text-center",
              variant === "danger" ? "bg-red-500/5" : "bg-primary/5"
            )}>
              <div className={cn(
                "h-16 w-16 rounded-full flex items-center justify-center mb-4",
                variant === "danger" ? "bg-red-500/10 text-red-500" : "bg-primary/10 text-primary"
              )}>
                <AlertTriangle className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-black text-white uppercase tracking-tight">{title}</h3>
              <p className="mt-2 text-white/50 text-sm font-medium leading-relaxed">{message}</p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 p-6 pt-2 bg-white/[0.02]">
              <button
                onClick={onClose}
                className="flex-1 py-4 rounded-2xl bg-white/5 text-white/40 hover:bg-white/10 hover:text-white font-black text-[11px] uppercase tracking-[0.2em] transition-all"
              >
                {cancelText}
              </button>
              <button
                onClick={onConfirm}
                disabled={isLoading}
                className={cn(
                  "flex-1 py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl transition-all active:scale-95 disabled:opacity-50",
                  variant === "danger" 
                    ? "bg-red-500 text-white shadow-red-500/20 hover:bg-red-600" 
                    : "bg-primary text-white shadow-primary/20 hover:bg-primary/80"
                )}
              >
                {isLoading ? "Processing..." : confirmText}
              </button>
            </div>

            <button 
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/5 text-white/20 hover:text-white transition-all"
            >
              <X className="h-5 w-5" />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
