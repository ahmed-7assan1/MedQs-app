"use client";

import { useEffect, useState } from "react";
import { motion, type Variants } from "framer-motion";
import { ChevronRight, Sparkles, Play, Star } from "lucide-react";
import Link from "next/link";
import { useLocale } from "@/contexts/LocaleContext";
import { EASE } from "./marketing-data";
import { useLazyFetch } from "@/hooks/useLazyFetch";

interface RandomUser {
  id: string;
  name: string;
  image: string;
}

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: EASE, delay: i * 0.06 },
  }),
};

export function Hero() {
  const { t } = useLocale();
  const [avatars, setAvatars] = useState<RandomUser[]>([]);
  const { ref: avatarRef, data: avatarData } = useLazyFetch<RandomUser[]>("/api/v1/users/random-avatars", { rootMargin: "0px" });

  useEffect(() => {
    if (Array.isArray(avatarData) && avatarData.length > 0) setAvatars(avatarData);
  }, [avatarData]);

  return (
    <section ref={avatarRef} className="relative mx-auto max-w-7xl px-6 pb-24 pt-4 md:pt-8">
      <div className="relative z-10 mx-auto max-w-3xl pt-4 text-center md:pt-8">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          custom={1}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary mb-8"
        >
          <Sparkles className="w-3.5 h-3.5" />
          {t("hero.badge")}
        </motion.div>

        <motion.h1
          variants={fadeUp}
          initial="hidden"
          animate="show"
          custom={2}
          className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[0.95]"
        >
          {t("hero.title")}
        </motion.h1>

        <motion.p
          variants={fadeUp}
          initial="hidden"
          animate="show"
          custom={3}
          className="mx-auto mt-6 max-w-lg text-base text-muted-foreground sm:text-lg leading-relaxed"
        >
          {t("hero.subtitle")}
        </motion.p>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          custom={4}
          className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link
            href="/register"
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-black px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:shadow-md dark:bg-white dark:text-black"
          >
            {t("hero.cta")} <ChevronRight className="h-4 w-4" />
          </Link>
          <Link
            href="/auth"
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium shadow-sm transition-all hover:shadow-md"
          >
            <Play className="h-4 w-4" /> {t("hero.secondaryCta")}
          </Link>
        </motion.div>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          custom={5}
          className="mt-8 flex items-center justify-center gap-4"
        >
          <div className="flex -space-x-3 rtl:space-x-reverse">
            {avatars.length === 4
              ? avatars.map((user) => (
                  <img
                    key={user.id}
                    src={user.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`}
                    alt={user.name}
                    className="w-10 h-10 rounded-full border-2 border-background object-cover"
                  />
                ))
              : [1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-background bg-gradient-to-br from-primary/60 to-primary/30 flex items-center justify-center text-xs font-bold text-primary-foreground">
                    {String.fromCharCode(64 + i)}
                  </div>
                ))}
          </div>
          <div className="text-left">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((s) => <Star key={s} className="w-4 h-4 fill-yellow-500 text-yellow-500" />)}
            </div>
            <p className="text-xs text-muted-foreground">{t("hero.lovedBy")}</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
