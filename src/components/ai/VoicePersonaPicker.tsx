"use client";

import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { VOICE_PERSONAS, VoicePersona } from "./voicePersonas";
import { X } from "@phosphor-icons/react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (persona: VoicePersona) => void;
  isDark: boolean;
}

export default function VoicePersonaPicker({ isOpen, onClose, onSelect, isDark }: Props) {
  const arabic = VOICE_PERSONAS.filter((p) => p.lang === "ar");
  const english = VOICE_PERSONAS.filter((p) => p.lang === "en");

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-max flex items-end md:items-center justify-center"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ type: "spring", stiffness: 300, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "relative w-full md:max-w-lg max-h-[85vh] rounded-t-3xl md:rounded-3xl shadow-2xl overflow-hidden md:mx-4",
              isDark ? "bg-[#050505] border-t md:border border-white/10" : "bg-white border-t md:border border-gray-200"
            )}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1 md:hidden">
              <div className={cn("w-10 h-1 rounded-full", isDark ? "bg-white/20" : "bg-gray-300")} />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-2 pb-4">
              <h2 className={cn("text-lg font-bold", isDark ? "text-white" : "text-gray-900")}>
                Voice Chat
              </h2>
              <button
                onClick={onClose}
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
                  isDark ? "text-gray-400 hover:bg-white/10 hover:text-white" : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                )}
              >
                <X size={18} weight="bold" />
              </button>
            </div>

            {/* Subtitle */}
            <p className={cn("text-sm px-6 pb-5", isDark ? "text-gray-400" : "text-gray-500")}>
              Choose who you want to talk to
            </p>

            {/* Content */}
            <div className="px-6 pb-8 overflow-y-auto max-h-[65vh]">
              {/* Arabic */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm font-bold text-emerald-500">العربية</span>
                  <div className={cn("flex-1 h-px", isDark ? "bg-white/10" : "bg-gray-200")} />
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {arabic.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => onSelect(p)}
                      className={cn(
                        "flex items-center gap-4 p-4 rounded-2xl text-left transition-all active:scale-[0.98]",
                        isDark
                          ? "bg-white/5 hover:bg-white/10"
                          : "bg-gray-50 hover:bg-gray-100"
                      )}
                    >
                      <div
                        className={cn(
                          "w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center text-white text-xl font-bold shadow-md flex-shrink-0",
                          p.gradient
                        )}
                      >
                        {p.avatar}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className={cn("text-base font-bold", isDark ? "text-white" : "text-gray-900")}>
                            {p.name}
                          </span>
                          <span className={cn(
                            "text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full",
                            isDark ? "bg-emerald-500/20 text-emerald-400" : "bg-emerald-100 text-emerald-700"
                          )}>
                            {p.langLabel}
                          </span>
                        </div>
                        <p className={cn("text-sm mt-0.5", isDark ? "text-gray-400" : "text-gray-500")}>
                          {p.description}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* English */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm font-bold text-blue-500">English</span>
                  <div className={cn("flex-1 h-px", isDark ? "bg-white/10" : "bg-gray-200")} />
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {english.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => onSelect(p)}
                      className={cn(
                        "flex items-center gap-4 p-4 rounded-2xl text-left transition-all active:scale-[0.98]",
                        isDark
                          ? "bg-white/5 hover:bg-white/10"
                          : "bg-gray-50 hover:bg-gray-100"
                      )}
                    >
                      <div
                        className={cn(
                          "w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center text-white text-xl font-bold shadow-md flex-shrink-0",
                          p.gradient
                        )}
                      >
                        {p.avatar}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className={cn("text-base font-bold", isDark ? "text-white" : "text-gray-900")}>
                            {p.name}
                          </span>
                          <span className={cn(
                            "text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full",
                            isDark ? "bg-blue-500/20 text-blue-400" : "bg-blue-100 text-blue-700"
                          )}>
                            {p.langLabel}
                          </span>
                        </div>
                        <p className={cn("text-sm mt-0.5", isDark ? "text-gray-400" : "text-gray-500")}>
                          {p.description}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
