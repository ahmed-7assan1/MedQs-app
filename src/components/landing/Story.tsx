"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { useSiteConfig } from "@/contexts/SiteConfigContext";
import { MedOneXLogoMark } from "@/components/branding/MedQsLogo";
import {
  ArrowDown, GitCommit, AlertTriangle, Quote, ChevronDown,
  ChevronUp, Globe, LucideIcon,
} from "lucide-react";
import { CHAPTERS, BRAND_VALUES, type Chapter } from "./story-data";
import { EASE, VIEWPORT } from "./marketing-data";

type Lang = "en" | "ar";

function useLang() {
  const [lang, setLang] = useState<Lang>("en");
  const toggle = () => setLang((l) => (l === "en" ? "ar" : "en"));
  return { lang, toggle, isAr: lang === "ar" };
}

function t<T>(en: T, ar: T, lang: Lang) {
  return lang === "ar" ? ar : en;
}

function badgeColor(type: "triumph" | "struggle" | "pivot") {
  switch (type) {
    case "triumph": return "border-emerald-500/30 bg-emerald-500/10 text-emerald-400";
    case "struggle": return "border-red-500/30 bg-red-500/10 text-red-400";
    case "pivot": return "border-amber-500/30 bg-amber-500/10 text-amber-400";
  }
}

function badgeLabel(type: "triumph" | "struggle" | "pivot", lang: Lang) {
  if (lang === "ar") {
    switch (type) {
      case "triumph": return "▲ نجاح";
      case "struggle": return "✕ عثرة";
      case "pivot": return "→ تغيير";
    }
  }
  switch (type) {
    case "triumph": return "▲ Triumph";
    case "struggle": return "✕ Struggle";
    case "pivot": return "→ Pivot";
  }
}

function ChapterCard({ chapter, index, lang }: { chapter: Chapter; index: number; lang: Lang }) {
  const [open, setOpen] = useState(false);
  const [showStruggle, setShowStruggle] = useState(false);
  const Icon = chapter.icon;
  const isAr = lang === "ar";

  const periodDate = chapter.period;
  const title = t(chapter.title, chapter.titleAr, lang);
  const subtitle = t(chapter.subtitle, chapter.subtitleAr, lang);
  const narrative = t(chapter.narrative, chapter.narrativeAr, lang);
  const struggle = t(chapter.struggle, chapter.struggleAr, lang);

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={VIEWPORT}
      transition={{ duration: 0.5, ease: EASE }}
      className="group"
    >
      <div
        className={`relative overflow-hidden rounded-2xl border border-border bg-card transition-all ${
          open ? "shadow-xl" : "shadow-sm hover:shadow-md"
        }`}
      >
        {/* Clickable preview header */}
        <button
          onClick={() => setOpen(!open)}
          className={`flex w-full items-center gap-4 p-5 text-left transition-colors hover:bg-accent/30 md:p-6 ${isAr ? "flex-row-reverse" : ""}`}
        >
          {/* Icon */}
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
            style={{ backgroundColor: "#405a8d" }}
          >
            <Icon className="h-5 w-5 text-white" />
          </div>

          {/* Info */}
          <div className={`flex-1 min-w-0 ${isAr ? "text-right" : ""}`}>
            <div className={`flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground ${isAr ? "flex-row-reverse" : ""}`}>
              <span className="rounded-md border border-border bg-background px-2 py-0.5">
                {t("Chapter", "الفصل", lang)} {index + 1}
              </span>
              <span className="rounded-md px-2 py-0.5 text-white" style={{ backgroundColor: "#405a8d" }}>
                {periodDate}
              </span>
            </div>
            <h3 className="mt-1 text-base font-bold tracking-tight md:text-lg">{title}</h3>
            <p className="text-xs text-muted-foreground/70">{subtitle}</p>
          </div>

          {/* Expand chevron */}
          <div className="shrink-0 text-muted-foreground transition-transform" style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}>
            <ChevronDown className="h-5 w-5" />
          </div>
        </button>

        {/* Expanded content */}
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.35, ease: EASE }}
              className="overflow-hidden"
            >
              <div className={`space-y-4 border-t border-border px-5 pb-6 pt-4 md:px-6 ${isAr ? "text-right" : ""}`}>
                {/* Narrative */}
                <p className="text-sm leading-relaxed text-muted-foreground">{narrative}</p>

                {/* Struggle (collapsible) */}
                <div>
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowStruggle(!showStruggle); }}
                    className={`inline-flex items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-1.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/10 ${isAr ? "flex-row-reverse" : ""}`}
                  >
                    <AlertTriangle className="h-3.5 w-3.5" />
                    {t("What went wrong", "اللي كان غلط", lang)}
                    {showStruggle ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  </button>
                  <AnimatePresence>
                    {showStruggle && (
                      <motion.p
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: EASE }}
                        className="mt-2 overflow-hidden text-xs leading-relaxed text-red-300/80"
                      >
                        {struggle}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                {/* Key commits */}
                <div>
                  <div className={`mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground ${isAr ? "flex-row-reverse" : ""}`}>
                    <GitCommit className="h-3 w-3" />
                    {t("Key moments", "لحظات مهمة", lang)}
                  </div>
                  <div className={`flex flex-wrap gap-1.5 ${isAr ? "flex-row-reverse" : ""}`}>
                    {chapter.milestones.map((m) => (
                      <span
                        key={m.commit}
                        className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-medium ${badgeColor(m.type)} ${isAr ? "flex-row-reverse" : ""}`}
                      >
                        {badgeLabel(m.type, lang)}
                        <span className="max-w-[180px] truncate">{m.commit}</span>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Commit count */}
                <div className="border-t border-border pt-3 text-[10px] text-muted-foreground/50">
                  {t(`${chapter.commitCount} commits in this chapter`, `${chapter.commitCount} commit في الفصل ده`, lang)}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function ProgressIndicator({ chapters, lang }: { chapters: Chapter[]; lang: Lang }) {
  const [visible, setVisible] = useState<number[]>([]);
  const isAr = lang === "ar";

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const id = Number(entry.target.getAttribute("data-chapter"));
          if (entry.isIntersecting) {
            setVisible((prev) => (prev.includes(id) ? prev : [...prev, id].sort()));
          } else {
            setVisible((prev) => prev.filter((v) => v !== id));
          }
        });
      },
      { threshold: 0.3 }
    );

    chapters.forEach((_, i) => {
      const el = document.querySelector(`[data-chapter="${i}"]`);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [chapters]);

  if (visible.length === 0) return null;
  const current = Math.max(...visible);

  return (
    <div
      className={`fixed bottom-6 z-40 flex items-center gap-2 rounded-full border border-border bg-background/80 px-4 py-2 text-xs font-medium text-muted-foreground backdrop-blur-md shadow-sm ${
        isAr ? "left-6" : "right-6"
      }`}
      dir={isAr ? "rtl" : "ltr"}
    >
      <span className="flex h-2 w-2 rounded-full" style={{ backgroundColor: "#405a8d" }} />
      {t("Chapter", "الفصل", lang)} {current + 1} {t("of", "من", lang)} {chapters.length}
    </div>
  );
}

export function Story() {
  const { siteName } = useSiteConfig();
  const { lang, toggle, isAr } = useLang();
  const topRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  const scrollToTimeline = () => {
    timelineRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen overflow-x-hidden" ref={topRef} dir={isAr ? "rtl" : "ltr"}>
      {/* ─── HERO ─── */}
      <section className="relative flex min-h-[80vh] flex-col items-center justify-center overflow-hidden px-6">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#405a8d]/10 via-transparent to-background" />
        <div className="pointer-events-none absolute left-1/2 top-1/3 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#405a8d]/20 blur-[120px]" />

        {/* Lang toggle */}
        <button
          onClick={toggle}
          className={`fixed top-4 z-50 flex items-center gap-2 rounded-full border border-border bg-background/80 px-4 py-2 text-xs font-medium text-muted-foreground backdrop-blur-md transition-colors hover:text-foreground ${
            isAr ? "right-4" : "right-4"
          }`}
        >
          <Globe className="h-3.5 w-3.5" />
          {isAr ? "English" : "بالعربي"}
        </button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE }}
          className="relative z-10 mx-auto max-w-3xl text-center"
        >
          <div className="mb-6 inline-flex items-center justify-center">
            <MedOneXLogoMark className="h-16 w-16 text-primary md:h-20 md:w-20" interactiveColor />
          </div>

          {isAr ? (
            <>
              <h1 className="text-4xl font-black tracking-tight md:text-6xl">
                قصة{" "}
                <span className="bg-gradient-to-r from-[#405a8d] to-[#dcdde6] bg-clip-text text-transparent">
                  {siteName}
                </span>{" "}
                الحقيقية
              </h1>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground md:text-lg">
                مش قصة تسويق. الرحلة الحقيقية — بكل build error، redirect loop،
                و 3 AM breakthrough. اللي حصل بالظبط من أول commit لحد النهاردة.
              </p>
            </>
          ) : (
            <>
              <h1 className="text-4xl font-black tracking-tight md:text-6xl">
                The{" "}
                <span className="bg-gradient-to-r from-[#405a8d] to-[#dcdde6] bg-clip-text text-transparent">
                  Real Story
                </span>{" "}
                of {siteName}
              </h1>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground md:text-lg">
                Not a marketing fable. The real journey — every build error,
                redirect loop, and 3 AM breakthrough included.
              </p>
            </>
          )}

          <div className={`mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground/60 ${isAr ? "flex-row-reverse" : ""}`}>
            <span className="rounded-full border border-border bg-card px-3 py-1">~300 commits</span>
            <span className="rounded-full border border-border bg-card px-3 py-1">{t("80 days", "80 يوم", lang)}</span>
            <span className="rounded-full border border-border bg-card px-3 py-1">{t("6 chapters", "6 فصول", lang)}</span>
          </div>

          <motion.button
            onClick={scrollToTimeline}
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="mt-10 inline-flex items-center gap-2 text-xs text-muted-foreground/50 transition-colors hover:text-muted-foreground"
          >
            {t("Scroll to explore", "اسحب لاستكشاف", lang)} <ArrowDown className="h-3 w-3" />
          </motion.button>
        </motion.div>
      </section>

      {/* ─── TIMELINE ─── */}
      <section ref={timelineRef} className="relative px-6 py-20 md:py-28">
        <div className="relative mx-auto max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={VIEWPORT}
            transition={{ duration: 0.5, ease: EASE }}
            className={`mb-12 text-center ${isAr ? "text-right" : ""}`}
          >
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              {t("The Timeline", "الخط الزمني", lang)}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("Every chapter, every struggle, every shipped feature", "كل فصل، كل عثرة، كل ميزة اتنشرت", lang)}
            </p>
          </motion.div>

          <div className="relative space-y-6">
            {CHAPTERS.map((chapter, i) => (
              <div key={chapter.id} data-chapter={i}>
                <ChapterCard chapter={chapter} index={i} lang={lang} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── BRAND VALUES ─── */}
      <section className="relative border-t border-border px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={VIEWPORT}
            transition={{ duration: 0.5, ease: EASE }}
            className={`mb-12 text-center ${isAr ? "text-right" : ""}`}
          >
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              {t("What We Believe", "إحنا مؤمنين بكده", lang)}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("These aren't corporate values. They're scars.", "دي مش قيم شركات. دي آثار المعارك.", lang)}
            </p>
          </motion.div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {BRAND_VALUES.map((v, i) => {
              const Icon = v.icon;
              return (
                <motion.div
                  key={v.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={VIEWPORT}
                  transition={{ duration: 0.4, ease: EASE, delay: i * 0.08 }}
                  className={`group relative overflow-hidden rounded-2xl border border-border bg-card p-6 transition-all hover:shadow-lg ${isAr ? "text-right" : ""}`}
                >
                  <div
                    className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{ backgroundColor: `${v.color}20` }}
                  >
                    <Icon className="h-5 w-5" style={{ color: v.color }} />
                  </div>
                  <h3 className="mb-2 text-base font-semibold">{t(v.title, v.titleAr, lang)}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {t(v.desc, v.descAr, lang)}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── FUTURE ─── */}
      <section className="relative overflow-hidden border-t border-border px-6 py-20">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#405a8d]/5 to-transparent" />
        <div className="pointer-events-none absolute bottom-0 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-[#405a8d]/10 blur-[100px]" />

        <div className="relative mx-auto max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={VIEWPORT}
            transition={{ duration: 0.5, ease: EASE }}
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-medium text-muted-foreground">
              <Quote className="h-3 w-3" />
              {t("What's next", "مستقبلاً", lang)}
            </div>

            {isAr ? (
              <>
                <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                  القصة لسه مخلصتش
                </h2>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                  كل commit هو جملة في الكتاب. كل build error هو twist في الحبكة.
                  بوت التليجرام لسه بيتعلم. الذكاء الاصطناعي لسه بيسمع.
                  اللاندينج بيج غالباً هتتعمل تاني بكره.
                </p>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground/60">
                  المشروع ده عايش. الفصل الجاي لسه متكتبش — ودي أجمل حاجة فيه.
                </p>
              </>
            ) : (
              <>
                <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                  The Story Isn&apos;t Over
                </h2>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                  Every commit is a sentence. Every build error is a plot twist.
                  The Telegram bot is still learning. The AI is still listening.
                  The landing page will probably be redesigned again tomorrow.
                </p>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground/60">
                  This repository is alive. The next chapter hasn&apos;t been written yet —
                  and that&apos;s exactly how it should be.
                </p>
              </>
            )}
          </motion.div>
        </div>
      </section>

      {/* Floating progress */}
      <ProgressIndicator chapters={CHAPTERS} lang={lang} />
    </div>
  );
}
