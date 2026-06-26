"use client";

import { useState, useEffect, useRef } from "react";
import { motion, useMotionValue, useAnimationFrame } from "framer-motion";
import { GraduationCap } from "lucide-react";
import { useLocale } from "@/contexts/LocaleContext";
import { EASE, VIEWPORT } from "./marketing-data";

interface University {
  id: string;
  name: string;
}

export function LogosStrip() {
  const { t } = useLocale();
  const [universities, setUniversities] = useState<University[]>([]);
  const stripRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);

  useEffect(() => {
    fetch("/api/v1/universities")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setUniversities(data);
      })
      .catch((err) => console.error("Failed to fetch universities:", err));
  }, []);

  useAnimationFrame((_, delta) => {
    const el = stripRef.current;
    if (!el) return;
    const half = el.scrollWidth / 2;
    const speed = 30;
    const next = x.get() - (speed * delta) / 1000;
    x.set(next <= -half ? next + half : next);
  });

  if (universities.length === 0) return null;

  return (
    <section className="border-y border-border/60 bg-card/40 py-10">
      <div className="mx-auto max-w-6xl px-6">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={VIEWPORT}
          transition={{ duration: 0.4, ease: EASE }}
          className="text-center text-xs uppercase tracking-widest text-muted-foreground"
        >
          {t("logosStrip.heading")}
        </motion.p>
        <div className="relative mt-6 overflow-hidden">
          <motion.div
            ref={stripRef}
            className="flex w-max gap-6 md:gap-16"
            style={{ x }}
          >
            {[...universities, ...universities].map((u, i) => (
              <div
                key={i}
                className="flex shrink-0 items-center gap-2 text-sm font-bold tracking-tight text-muted-foreground whitespace-nowrap"
              >
                <GraduationCap className="h-4 w-4 shrink-0" />
                {u.name}
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
