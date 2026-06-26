"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/contexts/LocaleContext";
import { createClient } from "@/lib/supabase/client";

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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const created = new Date(user.created_at).getTime();
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
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setShow(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-sm rounded-2xl border border-border bg-background p-6 text-center shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShow(false)}
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <Star className="h-7 w-7 text-primary" />
            </div>

            <h3 className="mt-5 text-lg font-bold">{t("reviewPrompt.title")}</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("reviewPrompt.description")}
            </p>

            <div className="mt-6 flex flex-col gap-2">
              <button
                onClick={() => {
                  setShow(false);
                  router.push("/#testimonials");
                  setTimeout(() => {
                    document.getElementById("testimonials")?.scrollIntoView({ behavior: "smooth" });
                    const btn = document.querySelector('[data-review-trigger="true"]');
                    (btn as HTMLButtonElement)?.click();
                  }, 500);
                }}
                className="rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-all hover:opacity-90"
              >
                {t("reviewPrompt.rateNow")}
              </button>
              <button
                onClick={() => {
                  localStorage.setItem("medqs-review-dismissed", "true");
                  setShow(false);
                }}
                className="rounded-full px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
              >
                {t("reviewPrompt.maybeLater")}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
