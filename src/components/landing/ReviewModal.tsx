"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, X } from "lucide-react";

interface ReviewModalProps {
  open: boolean;
  onClose: () => void;
  onSubmitted: () => void;
}

export function ReviewModal({ open, onClose, onSubmitted }: ReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

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
        setTimeout(() => { onSubmitted(); }, 1500);
      }
    } catch {
      // silently fail
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
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-md rounded-2xl border border-border bg-background p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>

            {done ? (
              <div className="py-8 text-center">
                <div className="text-4xl mb-4">🎉</div>
                <h3 className="text-lg font-bold">Thank you!</h3>
                <p className="mt-2 text-sm text-muted-foreground">Your review has been submitted and is pending approval.</p>
              </div>
            ) : (
              <>
                <h3 className="text-lg font-bold">Rate your experience</h3>
                <p className="mt-1 text-sm text-muted-foreground">Tap a star to rate</p>

                <div className="mt-6 flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      onMouseEnter={() => setHovered(s)}
                      onMouseLeave={() => setHovered(0)}
                      onClick={() => setRating(s)}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        className={`h-10 w-10 ${
                          s <= (hovered || rating)
                            ? "fill-yellow-500 text-yellow-500"
                            : "fill-none text-muted-foreground/30"
                        }`}
                      />
                    </button>
                  ))}
                </div>

                <textarea
                  placeholder="Tell us about your experience..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={4}
                  className="mt-6 w-full resize-none rounded-xl border border-border bg-secondary/50 p-3 text-sm outline-none transition-colors focus:border-primary"
                />

                <div className="mt-4 flex justify-end gap-3">
                  <button
                    onClick={onClose}
                    className="rounded-full px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={rating === 0 || !content.trim() || submitting}
                    className="rounded-full bg-primary px-6 py-2 text-sm font-medium text-primary-foreground transition-all hover:opacity-90 disabled:opacity-40"
                  >
                    {submitting ? "Submitting..." : "Submit Review"}
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
