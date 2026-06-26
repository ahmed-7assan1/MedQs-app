"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Smartphone, Download, Sparkles, CheckCircle2,
  Monitor, Tablet, Star, Shield, Zap,
  ChevronRight
} from "lucide-react";
import { Navbar } from "@/components/landing/Navbar";
import { MedOneXLogoMark } from "@/components/branding/MedQsLogo";
import { SectionHeader } from "@/components/landing/SectionHeader";
import { Footer } from "@/components/landing/Footer";
import { EASE, VIEWPORT } from "@/components/landing/marketing-data";
import { SiteConfigProvider } from "@/contexts/SiteConfigContext";
import { LandingPageWrapper } from "@/components/landing/LandingPageWrapper";

const APP_VERSION = "1.0.0";
const APK_URL = "/downloads/medonex-v1.0.0.apk";

const FEATURES = [
  { icon: Zap, title: "Lightning Fast", desc: "Optimized for instant loading and smooth navigation on any device" },
  { icon: Shield, title: "Secure & Private", desc: "End-to-end encryption for all your study data and communications" },
  { icon: Monitor, title: "Offline Mode", desc: "Download lectures and study materials for offline access anywhere" },
  { icon: Tablet, title: "Tablet Optimized", desc: "Full support for iPads and Android tablets with split-screen" },
  { icon: Star, title: "AI-Powered", desc: "Built-in Dr. Q AI assistant available 24/7 on your mobile" },
  { icon: Smartphone, title: "Push Notifications", desc: "Never miss an update with smart study reminders" },
];

const FADE_UP = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
};

const STAGGER = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

export default function DownloadPage() {
  return (
    <SiteConfigProvider>
      <LandingPageWrapper>
        <div className="min-h-screen overflow-x-hidden pt-[88px]">
      <Navbar />

      {/* ── Hero ── */}
      <section className="relative mx-auto max-w-7xl px-6 pb-24 pt-4 md:pt-8 overflow-hidden">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
          variants={STAGGER}
          className="mx-auto max-w-3xl pt-4 text-center md:pt-8"
        >
          <motion.div
            variants={FADE_UP}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary mb-8"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Version {APP_VERSION}
          </motion.div>

          <motion.h1
            variants={FADE_UP}
            className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[0.95]"
          >
            Get the{" "}
            <span className="bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent">
              MedOneX
            </span>{" "}
            App
          </motion.h1>

          <motion.p
            variants={FADE_UP}
            className="mx-auto mt-6 max-w-lg text-base text-muted-foreground sm:text-lg leading-relaxed"
          >
            Take your medical studies anywhere. The full MedOneX experience optimized for your phone and tablet.
          </motion.p>

          <motion.div
            variants={FADE_UP}
            className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <a
              href={APK_URL}
              download
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-[0_10px_30px_-10px_hsl(var(--primary)/0.6)] hover:opacity-90 transition-all"
            >
              <Download className="h-4 w-4" />
              Download for Android
            </a>
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm font-medium text-muted-foreground cursor-not-allowed">
              <Smartphone className="h-4 w-4" />
              iOS &mdash; Coming Soon
            </div>
          </motion.div>

          <motion.p
            variants={FADE_UP}
            className="mt-4 text-sm text-muted-foreground"
          >
            APK &middot; {APP_VERSION} &middot; ~25 MB &middot; Android 8.0+
          </motion.p>

          <motion.div
            variants={FADE_UP}
            className="relative mx-auto mt-16 max-w-5xl"
          >
            <div className="absolute inset-0 bg-primary/10 blur-[100px] -z-10" />
            <div className="flex justify-center gap-6">
              <div className="w-64 rounded-[40px] border-4 border-border bg-card shadow-2xl overflow-hidden">
                <div className="h-6 bg-muted flex items-center justify-center">
                  <div className="w-20 h-1.5 rounded-full bg-muted-foreground/30" />
                </div>
                <div className="aspect-[9/19] bg-gradient-to-b from-card to-background flex items-center justify-center p-4">
                  <div className="text-center">
                    <MedOneXLogoMark className="h-12 w-12 mx-auto mb-4 text-primary" />
                    <p className="text-foreground font-black text-lg">MedOneX</p>
                    <p className="text-muted-foreground text-xs mt-1">v{APP_VERSION}</p>
                  </div>
                </div>
              </div>
              <div className="hidden md:block w-64 rounded-[40px] border-4 border-border bg-card shadow-2xl overflow-hidden translate-y-8">
                <div className="h-6 bg-muted flex items-center justify-center">
                  <div className="w-20 h-1.5 rounded-full bg-muted-foreground/30" />
                </div>
                <div className="aspect-[9/19] bg-gradient-to-b from-card to-background flex items-center justify-center p-4">
                  <div className="w-full space-y-3">
                    <div className="h-4 w-3/4 rounded-full bg-primary/30" />
                    <div className="h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center px-4">
                      <div className="w-8 h-8 rounded-lg bg-primary/30 mr-3" />
                      <div className="flex-1">
                        <div className="h-2.5 w-20 rounded-full bg-foreground/20 mb-1" />
                        <div className="h-2 w-12 rounded-full bg-foreground/10" />
                      </div>
                    </div>
                    <div className="h-16 rounded-2xl bg-card border border-border flex items-center px-4">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/30 mr-3" />
                      <div className="flex-1">
                        <div className="h-2.5 w-16 rounded-full bg-foreground/20 mb-1" />
                        <div className="h-2 w-10 rounded-full bg-foreground/10" />
                      </div>
                    </div>
                    <div className="h-16 rounded-2xl bg-card border border-border flex items-center px-4">
                      <div className="w-8 h-8 rounded-lg bg-purple-500/30 mr-3" />
                      <div className="flex-1">
                        <div className="h-2.5 w-24 rounded-full bg-foreground/20 mb-1" />
                        <div className="h-2 w-14 rounded-full bg-foreground/10" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* ── Stats ── */}
      <section className="border-y border-border bg-card/40 py-12">
        <div className="mx-auto max-w-7xl px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={VIEWPORT}
            variants={STAGGER}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center"
          >
            {[
              { value: "5K+", label: "Downloads" },
              { value: "4.8", label: "App Rating", sub: "⭐" },
              { value: "25MB", label: "App Size" },
              { value: "99.9%", label: "Uptime" },
            ].map((stat) => (
              <motion.div key={stat.label} variants={FADE_UP}>
                <p className="text-3xl sm:text-4xl font-black text-foreground mb-2">{stat.value}</p>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">{stat.label}</p>
                {stat.sub && <p className="text-lg mt-1">{stat.sub}</p>}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <SectionHeader
          eyebrow="App Features"
          title="Everything in Your Pocket"
          subtitle="The same powerful platform, now mobile-native."
        />
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
          variants={STAGGER}
          className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          {FEATURES.map((feature, i) => (
            <motion.div
              key={i}
              variants={FADE_UP}
              className="group relative h-full flex-col overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/15 text-primary">
                <feature.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-foreground">{feature.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{feature.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── How to Install ── */}
      <section className="border-y border-border bg-card/40 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <SectionHeader
            eyebrow="Quick Setup"
            title="How to Install"
            subtitle="Just 3 simple steps"
          />
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={VIEWPORT}
            variants={STAGGER}
            className="mt-14 grid gap-5 sm:grid-cols-3"
          >
            {[
              { step: "01", title: "Download APK", desc: "Tap the download button above to get the APK file" },
              { step: "02", title: "Allow Installation", desc: "Go to Settings > Security > enable \"Unknown Sources\"" },
              { step: "03", title: "Install & Go", desc: "Open the APK and install. Sign in with your account" },
            ].map((item) => (
              <motion.div
                key={item.step}
                variants={FADE_UP}
                className="rounded-2xl border border-border bg-card p-6 text-center shadow-sm"
              >
                <div className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-primary/15 text-primary font-black text-lg">
                  {item.step}
                </div>
                <h3 className="mt-4 text-base font-semibold text-foreground">{item.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Auto-Update Section ── */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={VIEWPORT}
          transition={{ duration: 0.6, ease: EASE }}
          className="relative overflow-hidden rounded-2xl border border-border bg-card p-10 text-center shadow-[0_30px_80px_-30px_rgba(0,0,0,0.25)] md:p-16"
        >
          <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-amber-500/20 blur-3xl" />
          <Zap className="relative h-8 w-8 text-primary mx-auto mb-6" />
          <h2 className="relative text-balance text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            Automatic Updates
          </h2>
          <p className="relative mx-auto mt-4 max-w-md text-sm text-muted-foreground sm:text-base">
            No more manual downloads. The app updates itself automatically &mdash; just like Telegram or WhatsApp. Any UI improvements reach you instantly.
          </p>
          <div className="relative mt-8 flex flex-wrap justify-center gap-3">
            {["OTA Enabled", "No App Store", "Instant Delivery", "Zero Effort"].map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground"
              >
                <CheckCircle2 className="h-3 w-3 text-primary" />
                {tag}
              </span>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── CTA ── */}
      <section className="border-y border-border bg-card/40 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={VIEWPORT}
            transition={{ duration: 0.5, ease: EASE }}
            className="mx-auto max-w-3xl text-center"
          >
            <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
              <Sparkles className="h-3 w-3 text-primary" />
              Seamless Sync
            </div>
            <h2 className="mt-4 text-balance text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
              Start on Web, Continue on Mobile
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm text-muted-foreground sm:text-base">
              All your progress syncs automatically. Study anywhere, anytime.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/register"
                className="inline-flex items-center gap-1.5 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-[0_10px_30px_-10px_hsl(var(--primary)/0.6)]"
              >
                Get Started Free
                <ChevronRight className="h-4 w-4" />
              </Link>
              <a
                href={APK_URL}
                download
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-6 py-3 text-sm font-medium shadow-sm"
              >
                <Download className="h-4 w-4" />
                Download APK
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
        </div>
      </LandingPageWrapper>
    </SiteConfigProvider>
  );
}
