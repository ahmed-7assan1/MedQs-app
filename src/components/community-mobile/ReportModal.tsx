// src/components/community-mobile/ReportModal.tsx
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check } from "lucide-react";

import { REPORT_REASONS } from "./types";
import { submitReport } from "./api";
import { useCommunityStore } from "./store";

export default function ReportModal() {
  const reportTarget = useCommunityStore((s) => s.reportTarget);
  const closeReport = useCommunityStore((s) => s.closeReport);

  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  function handleClose() {
    setSelectedReason(null);
    setDescription("");
    setIsSubmitted(false);
    closeReport();
  }

  async function handleSubmit() {
    if (!reportTarget || !selectedReason) return;
    setIsSubmitting(true);
    try {
      await submitReport({
        targetType: reportTarget.type,
        targetId: reportTarget.id,
        reason: selectedReason,
        description: description.trim() || undefined,
      });
      setIsSubmitted(true);
      setTimeout(handleClose, 1200);
    } catch {
      setIsSubmitting(false);
    }
  }

  return (
    <AnimatePresence>
      {reportTarget && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 z-[80] bg-black/40"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-x-4 bottom-6 z-[81] rounded-2xl border border-border/60 bg-background p-4 shadow-lg"
          >
            {isSubmitted ? (
              <div className="flex flex-col items-center gap-2 py-6">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
                  <Check className="h-5 w-5" strokeWidth={1.5} />
                </span>
                <p className="text-sm font-medium text-foreground">Report submitted</p>
                <p className="text-xs text-muted-foreground">Thanks for helping keep this community safe</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-foreground">Report content</span>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="rounded-full p-1.5 text-muted-foreground transition-colors active:bg-muted"
                    aria-label="Close"
                  >
                    <X className="h-4 w-4" strokeWidth={1.5} />
                  </button>
                </div>

                <div className="mt-3 space-y-1.5">
                  {REPORT_REASONS.map((reason) => (
                    <button
                      key={reason.id}
                      type="button"
                      onClick={() => setSelectedReason(reason.id)}
                      className={`flex w-full items-center justify-between rounded-xl border px-3.5 py-2.5 text-left text-sm transition-colors duration-200 ${
                        selectedReason === reason.id
                          ? "border-primary bg-primary/5 text-foreground"
                          : "border-border/60 text-foreground active:bg-muted/40"
                      }`}
                    >
                      {reason.label}
                      {selectedReason === reason.id && (
                        <Check className="h-4 w-4 text-primary" strokeWidth={1.5} />
                      )}
                    </button>
                  ))}
                </div>

                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add more context (optional)"
                  rows={2}
                  className="mt-3 w-full resize-none rounded-xl border border-border/60 bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground/60 focus:outline-none"
                />

                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!selectedReason || isSubmitting}
                  className="mt-3 w-full rounded-full bg-primary py-2.5 text-sm font-medium text-primary-foreground transition-opacity disabled:opacity-40"
                >
                  {isSubmitting ? "Submitting…" : "Submit report"}
                </button>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
