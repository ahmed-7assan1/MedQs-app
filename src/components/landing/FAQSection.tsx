"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronRight, MessageSquare, Sparkles } from "lucide-react";
import { useLocale } from "@/contexts/LocaleContext";
import { EASE } from "./marketing-data";

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: (i: number = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.5, ease: EASE, delay: i * 0.06 },
  }),
};

interface QA {
  q: string;
  a: string;
}

interface Category {
  id: string;
  label: string;
  questions: QA[];
}

export function FAQSection() {
  const { t } = useLocale();
  const [activeCategory, setActiveCategory] = useState<string>("account");
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});

  const categories = t("faq.categories") as unknown as Category[];

  const activeQuestions = categories.find((c) => c.id === activeCategory)?.questions || [];

  const toggleItem = (idx: number) => {
    setOpenItems((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  return (
    <section className="mx-auto max-w-7xl px-6 py-24">
      <motion.div
        className="mx-auto max-w-2xl text-center"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.25 }}
      >
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 12 },
            visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE } },
          }}
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground"
        >
          <Sparkles className="h-3 w-3 text-primary" />
          {t("faq.eyebrow")}
        </motion.div>
        <motion.h2
          variants={{
            hidden: { opacity: 0, y: 16 },
            visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE, delay: 0.05 } },
          }}
          className="mt-4 text-balance text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl"
        >
          {t("faq.title")}
        </motion.h2>
        <motion.p
          variants={{
            hidden: { opacity: 0, y: 16 },
            visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE, delay: 0.1 } },
          }}
          className="mx-auto mt-4 max-w-xl text-sm text-muted-foreground sm:text-base"
        >
          {t("faq.subtitle")}
        </motion.p>
      </motion.div>

      <div className="mx-auto mt-14 max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.4, ease: EASE }}
          className="mb-8 flex p-0.5 rounded-xl bg-secondary border border-border"
        >
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => { setActiveCategory(cat.id); setOpenItems({}); }}
              className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-widest rounded-lg transition-all ${
                activeCategory === cat.id
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </motion.div>

        <div className="space-y-3">
          {activeQuestions.map((item, idx) => {
            const isOpen = openItems[idx];
            return (
              <motion.div
                key={idx}
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.1 }}
                custom={idx}
                className="rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md"
              >
                <button
                  onClick={() => toggleItem(idx)}
                  className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                >
                  <span className="text-sm font-semibold sm:text-base">{item.q}</span>
                  <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.25, ease: EASE }}
                    className="shrink-0 text-muted-foreground"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </motion.div>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      key="content"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: EASE }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-5 pt-0">
                        <div className="h-px bg-border mb-4" />
                        <p className="text-sm leading-relaxed text-muted-foreground">
                          {item.a}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.25 }}
        transition={{ duration: 0.6, ease: EASE }}
        className="relative mx-auto mt-20 max-w-3xl overflow-hidden rounded-3xl border border-border bg-card p-10 text-center shadow-[0_30px_80px_-30px_rgba(0,0,0,0.25)] md:p-16"
      >
        <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-amber-500/20 blur-3xl" />
        <div className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20">
          <MessageSquare className="h-6 w-6 text-primary" />
        </div>
        <h2 className="relative mt-6 text-balance text-2xl font-bold tracking-tight sm:text-3xl">
          {t("faq.ctaTitle")}
        </h2>
        <p className="relative mx-auto mt-3 max-w-md text-sm text-muted-foreground sm:text-base">
          {t("faq.ctaSubtitle")}
        </p>
        <a
          href="mailto:support@medonex.com"
          className="relative mt-8 inline-flex items-center gap-1.5 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-[0_10px_30px_-10px_hsl(var(--primary)/0.6)] transition-all hover:opacity-90"
        >
          {t("faq.ctaButton")}
          <ChevronRight className="h-4 w-4" />
        </a>
      </motion.div>
    </section>
  );
}
