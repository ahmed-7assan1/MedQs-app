"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Flag, PaperPlaneRight, CircleNotch } from "@phosphor-icons/react";
import toast from "react-hot-toast";

const REPORT_REASONS = [
  { value: "spam", label: "Spam" },
  { value: "harassment", label: "Harassment or bullying" },
  { value: "hate_speech", label: "Hate speech" },
  { value: "misinformation", label: "Misinformation" },
  { value: "inappropriate", label: "Inappropriate content" },
  { value: "violence", label: "Violence or threats" },
  { value: "impersonation", label: "Impersonation" },
  { value: "other", label: "Other" },
];

interface Props {
  open: boolean;
  onClose: () => void;
  targetType: "POST" | "COMMENT" | "USER";
  targetId: string;
}

export function ReportModal({ open, onClose, targetType, targetId }: Props) {
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason) return toast.error("Please select a reason");
    setSubmitting(true);
    try {
      const res = await fetch("/api/v1/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetType, targetId, reason, description: description.trim() || undefined }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Report submitted. Thank you.");
        onClose();
        setReason("");
        setDescription("");
      } else {
        toast.error(data.error || "Failed to submit report");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-card rounded-2xl shadow-2xl border border-border w-full max-w-md overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <Flag size={20} weight="bold" className="text-red-500" />
                  <h2 className="text-lg font-bold text-foreground">Report {targetType.toLowerCase()}</h2>
                </div>
                <button onClick={onClose} className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-all">
                  <X size={18} weight="bold" />
                </button>
              </div>

              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-foreground/70 mb-1.5">Reason</label>
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted/30 text-foreground text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="">Select a reason...</option>
                    {REPORT_REASONS.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-foreground/70 mb-1.5">Additional details (optional)</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide any additional context..."
                    rows={3}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#1f1e36] text-slate-800 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                  />
                </div>
              </div>

              <div className="p-4 pt-0">
                <button
                  onClick={handleSubmit}
                  disabled={submitting || !reason}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold transition-all"
                >
                  {submitting ? (
                    <CircleNotch size={18} weight="bold" className="animate-spin" />
                  ) : (
                    <PaperPlaneRight size={18} weight="bold" />
                  )}
                  Submit report
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
