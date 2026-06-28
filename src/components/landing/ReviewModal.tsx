"use client";

import { useState, useRef, useEffect, useId } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2 } from "lucide-react";
import { useLocale } from "@/contexts/LocaleContext";

const ease = [0.22, 1, 0.36, 1] as const;



interface ReviewModalProps {
  open: boolean;
  onClose: () => void;
  onSubmitted: () => void;
}

function StarIcon({ filled, size }: { filled: boolean; size: number }) {
  const uid = useId();
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`${uid}-grad`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>
        <filter id={`${uid}-glow`}>
          <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#F59E0B" floodOpacity="0.5" />
        </filter>
      </defs>
      <path
        d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
        fill={filled ? `url(#${uid}-grad)` : "none"}
        stroke={filled ? `url(#${uid}-grad)` : "currentColor"}
        strokeWidth={filled ? 0 : 1.5}
        strokeOpacity={filled ? 0 : 0.25}
        filter={filled ? `url(#${uid}-glow)` : undefined}
      />
    </svg>
  );
}

export function ReviewModal({ open, onClose, onSubmitted }: ReviewModalProps) {
  const { t, locale } = useLocale();
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleSubmit = async () => {
    if (rating === 0 || !content.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/v1/testimonials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, content: content.trim() }),
      });
      if (res.ok) {
        localStorage.setItem("medqs-reviewed", "true");
        setDone(true);
        timeoutRef.current = setTimeout(() => { onSubmitted(); }, 1500);
      }
    } catch {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          onClick={onClose}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40" />

          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ duration: 0.35, ease, delay: 0.05 }}
            className="relative w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative overflow-hidden rounded-2xl border border-border dark:border-white/[0.12] bg-white dark:bg-background/40 p-7 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.5)] backdrop-blur-xl sm:p-8">

              {/* Subtle top glow */}
              <div className="pointer-events-none absolute -inset-x-20 -top-20 h-40 bg-gradient-to-b from-primary/15 to-transparent" />

              <button
                onClick={onClose}
                className="absolute right-4 top-4 z-10 rounded-full p-1.5 text-muted-foreground/60 transition-colors hover:bg-black/5 dark:hover:bg-white/5 hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>

              {done ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center py-6 text-center"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.1 }}
                    className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 ring-1 ring-emerald-500/20"
                  >
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                      <motion.path
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.4, delay: 0.2 }}
                        d="M5 13l4 4L19 7"
                        stroke="#10B981"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </motion.div>
                  <h3 className="mt-5 text-lg font-bold">{t("reviewModal.thankYou")}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">{t("reviewModal.pendingMessage")}</p>
                </motion.div>
              ) : (
                <div className="space-y-6">
                  {/* Header */}
                  <div>
                    <h3 className="text-lg font-bold">{t("reviewModal.title")}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{t("reviewModal.subtitle")}</p>
                  </div>

                  {/* Stars */}
                  <div className="flex items-center justify-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((s) => {
                      const active = s <= (hovered || rating);
                      return (
                        <button
                          key={s}
                          onMouseEnter={() => setHovered(s)}
                          onMouseLeave={() => setHovered(0)}
                          onClick={() => setRating(s)}
                          className="relative p-1 outline-none transition-transform duration-150 ease-out hover:scale-110 active:scale-90"
                        >
                          <div
                            className={`absolute inset-0 rounded-xl bg-gradient-to-br from-amber-500/15 to-amber-600/10 transition-opacity duration-150 ${active ? "opacity-100" : "opacity-0"}`}
                          />
                          <StarIcon filled={active} size={36} />
                        </button>
                      );
                    })}
                  </div>

                  {/* Rating label */}
                  {rating > 0 && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="-mt-2 text-center text-xs font-medium text-amber-500"
                    >
                      {rating === 1 && "Needs improvement"}
                      {rating === 2 && "Fair"}
                      {rating === 3 && "Good"}
                      {rating === 4 && "Great"}
                      {rating === 5 && "Excellent!"}
                    </motion.p>
                  )}

                  {/* Textarea */}
                  <textarea
                    placeholder={t("reviewModal.placeholder")}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={4}
                    className="w-full resize-none rounded-xl border border-border bg-black/[0.02] dark:bg-white/[0.03] p-3.5 text-sm outline-none transition-all placeholder:text-muted-foreground/40 focus:border-primary/50 focus:bg-black/[0.04] dark:focus:bg-white/[0.05] focus:ring-4 focus:ring-primary/5"
                  />

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-3">
                    <button
                      onClick={onClose}
                      className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {t("reviewModal.cancel")}
                    </button>
                    <motion.button
                      whileHover={{ y: -1 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleSubmit}
                      disabled={rating === 0 || !content.trim() || submitting}
                      className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground shadow-[0_4px_20px_-6px_hsl(var(--primary))] transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {submitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        t("reviewModal.submit")
                      )}
                    </motion.button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
