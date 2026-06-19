"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { X, Link as LinkIcon, ArrowSquareOut } from "@phosphor-icons/react";

export interface ResourceItem {
  url: string;
  title?: string;
}

interface ResourcesBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  resources: ResourceItem[];
  isDark: boolean;
}

export function ResourcesBottomSheet({ isOpen, onClose, resources, isDark }: ResourcesBottomSheetProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[10030]"
          onClick={onClose}
        >
          <div className={cn("absolute inset-0", isDark ? "bg-black/60 backdrop-blur-sm" : "bg-black/40 backdrop-blur-sm")} />

          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "absolute bottom-0 left-0 right-0 max-h-[70vh] rounded-t-3xl shadow-2xl flex flex-col overflow-hidden",
              isDark ? "bg-[#050505] border-t border-white/10" : "bg-[#FCFCFC] border-t border-gray-200"
            )}
          >
            <div className="flex justify-center pt-3 pb-1">
              <div className={cn("w-10 h-1 rounded-full", isDark ? "bg-white/20" : "bg-gray-300")} />
            </div>

            <div className={cn("flex items-center justify-between px-5 py-3 border-b", isDark ? "border-white/10" : "border-gray-200")}>
              <div className="flex items-center gap-2.5">
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", isDark ? "bg-white/10" : "bg-blue-50")}>
                  <LinkIcon size={16} weight="bold" className={isDark ? "text-white" : "text-blue-500"} />
                </div>
                <h2 className={cn("text-sm font-bold", isDark ? "text-white" : "text-gray-900")}>
                  Resources ({resources.length})
                </h2>
              </div>
              <button onClick={onClose} className={cn("p-2 rounded-xl transition-colors", isDark ? "text-gray-400 hover:bg-white/10" : "text-gray-500 hover:bg-gray-100")}>
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar px-5 py-4 space-y-2">
              {resources.map((r, i) => (
                <a
                  key={i}
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl border transition-all",
                    isDark ? "border-white/10 hover:bg-white/5" : "border-gray-200 hover:bg-gray-50"
                  )}
                >
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", isDark ? "bg-white/10" : "bg-blue-50")}>
                    <ArrowSquareOut size={14} className={isDark ? "text-white" : "text-blue-500"} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-sm font-medium truncate", isDark ? "text-white" : "text-gray-900")}>
                      {r.title || r.url}
                    </p>
                    <p className={cn("text-[11px] truncate", isDark ? "text-gray-500" : "text-gray-400")}>
                      {r.url}
                    </p>
                  </div>
                </a>
              ))}
              {resources.length === 0 && (
                <p className={cn("text-sm text-center py-8", isDark ? "text-gray-500" : "text-gray-400")}>No resources found</p>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
