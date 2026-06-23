"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { useSiteConfig } from "@/contexts/SiteConfigContext";
import { MedOneXLogoMark } from "@/components/branding/MedQsLogo";
import {
  ArrowDown, ChevronDown, ArrowLeft, BookOpen,
  type LucideIcon,
} from "lucide-react";
import { CHAPTERS, BRAND_VALUES, type Chapter } from "./story-data";
import { EASE, VIEWPORT } from "./marketing-data";
import Link from "next/link";

type Lang = "en" | "ar";

function useLang() {
  const [lang, setLang] = useState<Lang>("en");
  const toggle = () => setLang((l) => (l === "en" ? "ar" : "en"));
  return { lang, toggle, isAr: lang === "ar" };
}

function t<T>(en: T, ar: T, lang: Lang) {
  return lang === "ar" ? ar : en;
}

function ChapterCard({ chapter, index, lang }: { chapter: Chapter; index: number; lang: Lang }) {
  const [open, setOpen] = useState(false);
  const Icon = chapter.icon;
  const isAr = lang === "ar";
  const narrative = t(chapter.narrative, chapter.narrativeAr, lang);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={VIEWPORT}
      transition={{ duration: 0.5, ease: EASE, delay: 0.05 }}
      className="group"
    >
      <div
        className={`relative overflow-hidden rounded-2xl border border-border bg-card transition-all ${
          open ? "shadow-xl" : "shadow-sm hover:shadow-md"
        } ${open ? "ring-1 ring-[#405a8d]/20" : ""}`}
      >
        {/* Clickable header */}
        <button
          onClick={() => setOpen(!open)}
          className={`flex w-full items-center gap-4 p-5 text-left transition-colors hover:bg-accent/30 md:p-6 ${isAr ? "flex-row-reverse" : ""}`}
        >
          {/* Number badge */}
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-lg font-bold text-white"
            style={{ backgroundColor: "#405a8d" }}
          >
            {index + 1}
          </div>

          {/* Title + period */}
          <div className={`flex-1 min-w-0 ${isAr ? "text-right" : ""}`}>
            <div className={`flex items-center gap-2 mb-0.5 ${isAr ? "flex-row-reverse" : ""}`}>
              <span className="inline-flex items-center gap-1 rounded-md px-2.5 py-0.5 text-[11px] font-semibold text-white" style={{ backgroundColor: "#405a8d" }}>
                <BookOpen className="h-3 w-3" />
                {chapter.period}
              </span>
            </div>
            <h3 className="text-sm font-bold leading-snug tracking-tight md:text-base">
              {t(chapter.title, chapter.title, lang)}
            </h3>
          </div>

          <div className="shrink-0 text-muted-foreground transition-transform duration-300" style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}>
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
                <div className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
                  {narrative}
                </div>

                {/* Milestones */}
                {chapter.milestones.length > 0 && (
                  <div>
                    <p className={`mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 ${isAr ? "text-right" : ""}`}>
                      {t("Key moments", "محطات مهمة", lang)}
                    </p>
                    <ul className={`space-y-1.5 ${isAr ? "text-right" : ""}`}>
                      {chapter.milestones.map((m, i) => (
                        <li key={i} className={`flex items-start gap-2 text-xs text-muted-foreground/80 ${isAr ? "flex-row-reverse" : ""}`}>
                          <span
                            className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full"
                            style={{ backgroundColor: "#405a8d" }}
                          />
                          {m}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
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

        {/* Top bar */}
        <div className={`fixed top-4 z-50 flex items-center gap-3 ${isAr ? "left-4" : "left-4"}`}>
          <Link
            href="/"
            className="flex items-center gap-2 rounded-full border border-border bg-background/80 px-4 py-2 text-xs font-medium text-muted-foreground backdrop-blur-md transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {t("Back", "رجوع", lang)}
          </Link>
        </div>

        <button
          onClick={toggle}
          className={`fixed top-4 z-50 flex items-center gap-2 rounded-full border border-border bg-background/80 px-4 py-2 text-xs font-medium text-muted-foreground backdrop-blur-md transition-colors hover:text-foreground ${
            isAr ? "right-4" : "right-4"
          }`}
        >
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
              <h1 className="text-3xl font-black tracking-tight md:text-5xl">
                قصة{" "}
                <span className="bg-gradient-to-r from-[#405a8d] to-[#dcdde6] bg-clip-text text-transparent">
                  {siteName}
                </span>
              </h1>
              <p className="mt-2 text-sm text-muted-foreground/70 md:text-base">
                من فكرة بسيطة إلى منصة طبية متكاملة
              </p>
              <p className="mt-4 max-w-xl mx-auto text-sm leading-relaxed text-muted-foreground md:text-base">
                كل حاجة بدأت بسؤال بسيط قاله طالب طب. مش خطة عمل، مش اجتماع. مجرد سؤال.
              </p>
            </>
          ) : (
            <>
              <h1 className="text-3xl font-black tracking-tight md:text-5xl">
                The{" "}
                <span className="bg-gradient-to-r from-[#405a8d] to-[#dcdde6] bg-clip-text text-transparent">
                  Real Story
                </span>{" "}
                of {siteName}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground/70 md:text-base">
                From a simple idea to a complete medical platform
              </p>
              <p className="mt-4 max-w-xl mx-auto text-sm leading-relaxed text-muted-foreground md:text-base">
                It all started with a simple question a medical student asked. Not a business plan, not a meeting. Just a question.
              </p>
            </>
          )}

          <div className={`mt-6 flex flex-wrap items-center justify-center gap-3 text-xs text-muted-foreground/60 ${isAr ? "flex-row-reverse" : ""}`}>
            <span className="rounded-full border border-border bg-card px-3 py-1">
              {t("9 chapters", "9 فصول", lang)}
            </span>
            <span className="rounded-full border border-border bg-card px-3 py-1">
              {t("From 2024", "من 2024", lang)}
            </span>
            <span className="rounded-full border border-border bg-card px-3 py-1">
              {t("Born from a question", "من سؤال طالب", lang)}
            </span>
          </div>

          <motion.button
            onClick={scrollToTimeline}
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="mt-8 inline-flex items-center gap-2 text-xs text-muted-foreground/50 transition-colors hover:text-muted-foreground"
          >
            {t("Read the story", "اقرأ القصة", lang)} <ArrowDown className="h-3 w-3" />
          </motion.button>
        </motion.div>
      </section>

      {/* ─── TIMELINE ─── */}
      <section ref={timelineRef} className="relative px-6 pb-20 md:pb-28">
        <div className="relative mx-auto max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={VIEWPORT}
            transition={{ duration: 0.5, ease: EASE }}
            className={`mb-10 text-center ${isAr ? "text-right" : ""}`}
          >
            <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
              {t("The Journey", "الرحلة", lang)}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("Tap any chapter to read", "اضغط على أي فصل لقراءته", lang)}
            </p>
          </motion.div>

          <div className="relative space-y-4">
            {CHAPTERS.map((chapter, i) => (
              <div key={chapter.id} data-chapter={i}>
                <ChapterCard chapter={chapter} index={i} lang={lang} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── BRAND VALUES ─── */}
      <section className="relative border-t border-border px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={VIEWPORT}
            transition={{ duration: 0.5, ease: EASE }}
            className={`mb-10 text-center ${isAr ? "text-right" : ""}`}
          >
            <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
              {t("What We Believe", "إحنا مؤمنين بكده", lang)}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
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
                  <h3 className="mb-2 text-sm font-semibold">{t(v.title, v.titleAr, lang)}</h3>
                  <p className="text-xs leading-relaxed text-muted-foreground">
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
            {isAr ? (
              <>
                <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
                  القصة لسه مخلصتش
                </h2>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground max-w-lg mx-auto">
                  كل فصل جديد بيكتب دلوقتي. الفكرة الجاية ممكن تبدأ من سؤال بسيط — زيه زي أول سؤال.
                </p>
                <p className="mt-3 text-xs text-muted-foreground/60">
                  — وممكن تكون إنت اللي تسأله.
                </p>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
                  The Story Isn&apos;t Over
                </h2>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground max-w-lg mx-auto">
                  Every new chapter is being written right now. The next idea might start with a simple question — just like the first one.
                </p>
                <p className="mt-3 text-xs text-muted-foreground/60">
                  — And you might be the one asking it.
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
