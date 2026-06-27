"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/contexts/LocaleContext";
import { createClient } from "@/lib/supabase/client";

const ease = [0.22, 1, 0.36, 1] as const;

function StarIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="promptStar" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>
      </defs>
      <path
        d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
        fill="url(#promptStar)"
      />
    </svg>
  );
}

export function ReviewPromptModal() {
  const { t, locale } = useLocale();
  const [show, setShow] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const dismissed = localStorage.getItem("medqs-review-dismissed");
    const reviewed = localStorage.getItem("medqs-reviewed");
    if (dismissed || reviewed) return;

    const check = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const created = new Date(session.user.created_at).getTime();
      const now = Date.now();
      const daysSince = (now - created) / (1000 * 60 * 60 * 24);
      if (daysSince >= 2) setShow(true);
    };
    check();
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          onClick={() => setShow(false)}
        >
          <div className="absolute inset-0 bg-black/40" />

          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ duration: 0.35, ease, delay: 0.05 }}
            className="relative w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative overflow-hidden rounded-2xl border border-border dark:border-white/[0.12] bg-white dark:bg-background/40 p-7 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.5)] backdrop-blur-xl sm:p-8">
              <div className="pointer-events-none absolute -inset-x-20 -top-20 h-40 bg-gradient-to-b from-primary/15 to-transparent" />

              <button
                onClick={() => setShow(false)}
                className="absolute right-4 top-4 z-10 rounded-full p-1.5 text-muted-foreground/60 transition-colors hover:bg-black/5 dark:hover:bg-white/5 hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="flex flex-col items-center text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.1 }}
                  className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 ring-1 ring-amber-500/20"
                >
                  <StarIcon />
                </motion.div>

                <h3 className="mt-5 text-lg font-bold">{t("reviewPrompt.title")}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {t("reviewPrompt.description")}
                </p>

                <div className="mt-7 flex w-full flex-col gap-2.5">
                  <motion.button
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setShow(false);
                      router.push("/#testimonials");
                      setTimeout(() => {
                        document.getElementById("testimonials")?.scrollIntoView({ behavior: "smooth" });
                        const btn = document.querySelector('[data-review-trigger="true"]');
                        (btn as HTMLButtonElement)?.click();
                      }, 500);
                    }}
                    className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-medium text-primary-foreground shadow-[0_4px_20px_-6px_hsl(var(--primary))] transition-all hover:opacity-90"
                  >
                    <Sparkles className="h-4 w-4" />
                    {t("reviewPrompt.rateNow")}
                  </motion.button>
                  <button
                    onClick={() => {
                      localStorage.setItem("medqs-review-dismissed", "true");
                      setShow(false);
                    }}
                    className="rounded-full px-4 py-2.5 text-sm font-medium text-muted-foreground/70 transition-colors hover:text-foreground"
                  >
                    {t("reviewPrompt.maybeLater")}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
