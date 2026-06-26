"use client";

import { motion } from "framer-motion";
import { Sparkles, Check } from "lucide-react";
import { useLocale } from "@/contexts/LocaleContext";
import { EASE, VIEWPORT } from "./marketing-data";

export function Showcase() {
  const { t, locale } = useLocale();
  return (
    <section className="mx-auto max-w-7xl px-6 py-24">
      <div className="grid items-center gap-12 md:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={VIEWPORT}
          transition={{ duration: 0.6, ease: EASE }}
        >
          <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            <Sparkles className="h-3 w-3 text-primary" />
            {t("showcase.badge")}
          </div>
          <h2
            className="mt-4 text-balance text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl"
            dangerouslySetInnerHTML={{ __html: t("showcase.title") }}
          />
          <p className="mt-4 text-muted-foreground">{t("showcase.subtitle")}</p>
          <ul className="mt-6 space-y-3">
            {(t("showcase.bullets") as string[]).map((b, i) => (
              <motion.li
                key={b}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={VIEWPORT}
                transition={{ duration: 0.4, ease: EASE, delay: i * 0.06 }}
                className="flex items-center gap-3 text-sm"
              >
                <span className="grid h-5 w-5 place-items-center rounded-full bg-primary/15 text-primary">
                  <Check className="h-3 w-3" strokeWidth={3} />
                </span>
                {b}
              </motion.li>
            ))}
          </ul>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={VIEWPORT}
          transition={{ duration: 0.6, ease: EASE }}
          className="relative"
        >
          <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-primary/10 blur-2xl" />
          <div className="rounded-3xl border border-border bg-card p-5 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.25)]">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-destructive/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-primary/70" />
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3">
              {(t("showcase.subjects") as string[]).map((d, i) => (
                <div key={d} className="rounded-xl bg-secondary/60 p-3">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{d}</div>
                  <div className="mt-2 space-y-1.5">
                    {[60, 80, 40].map((w, j) => (
                      <motion.div
                        key={j}
                        initial={{ width: 0 }}
                        whileInView={{ width: `${w}%` }}
                        viewport={VIEWPORT}
                        transition={{ duration: 0.6, ease: EASE, delay: 0.2 + i * 0.1 + j * 0.08 }}
                        className={`h-2 rounded-full ${j === 0 ? "bg-primary" : j === 1 ? "bg-orange-400" : "bg-foreground/70"}`}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-xl border border-border bg-background p-4">
              <div className="text-xs font-semibold">{t("showcase.weeklyProgress")}</div>
              <div className="mt-3 flex items-end gap-2">
                {[40, 70, 55, 90, 65, 80, 50].map((h, i) => (
                  <motion.div
                    key={i}
                    initial={{ height: 0 }}
                    whileInView={{ height: `${h}%` }}
                    viewport={VIEWPORT}
                    transition={{ duration: 0.5, ease: EASE, delay: i * 0.05 }}
                    className="w-full rounded-md bg-primary/80"
                    style={{ minHeight: 6 }}
                  />
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
