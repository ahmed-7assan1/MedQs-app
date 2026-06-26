"use client";

import { motion, type Variants } from "framer-motion";
import Link from "next/link";
import type { ReactNode } from "react";
import { useSiteConfig } from "@/contexts/SiteConfigContext";
import { MedOneXLogoMark } from "@/components/branding/MedQsLogo";

const ease = [0.22, 1, 0.36, 1] as const;

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: (i: number = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.5, ease, delay: i * 0.06 },
  }),
};

export function NewAuthShell({ eyebrow, title, subtitle, footer, children }: {
  eyebrow: string; title: string; subtitle: string; footer: ReactNode; children: ReactNode;
}) {
  const { siteName } = useSiteConfig();
  return (
    <div className="relative min-h-screen overflow-hidden">
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease }}
        className="relative z-30 mx-auto flex max-w-7xl items-center justify-between px-6 py-5"
      >
        <Link href="/" className="flex items-center gap-2">
          <MedOneXLogoMark className="h-8 w-8 shrink-0 text-[#13171E] dark:text-white" interactiveColor />
          <div className="flex items-center gap-2">
            <div className="h-6 w-px bg-[#49495A] dark:bg-white/20" />
            <span className="text-[15px] font-bold tracking-tight text-[#13171E] dark:text-white mt-0.5">{siteName}</span>
          </div>
        </Link>
        <Link href="/" className="rounded-full border border-border bg-card px-4 py-2 text-sm font-medium shadow-sm transition-all hover:shadow-md">
          Back to home
        </Link>
      </motion.header>

      <main className="relative z-10 mx-auto flex max-w-7xl items-center justify-center px-6 pb-20 pt-6 md:pt-10">
        <motion.div variants={fadeUp} initial="hidden" animate="show" custom={1} className="w-full max-w-md">
          <div className="rounded-3xl border border-border bg-card/90 p-8 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.4)] backdrop-blur-sm sm:p-10">
            <motion.p variants={fadeUp} custom={2} className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              {eyebrow}
            </motion.p>
            <motion.h1 variants={fadeUp} custom={3} className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              {title}
            </motion.h1>
            <motion.p variants={fadeUp} custom={4} className="mt-2 text-sm text-muted-foreground">
              {subtitle}
            </motion.p>
            <motion.div variants={fadeUp} custom={5} className="mt-8">
              {children}
            </motion.div>
          </div>
          <motion.p variants={fadeUp} custom={7} className="mt-6 text-center text-sm text-muted-foreground">
            {footer}
          </motion.p>
        </motion.div>
      </main>
    </div>
  );
}
