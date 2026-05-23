import Link from "next/link";
import Image from "next/image";
import {
  Smartphone, Download, Sparkles, CheckCircle2,
  Monitor, Tablet, Star, Shield, Zap, ArrowLeft,
  ChevronRight
} from "lucide-react";
import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { CinematicBackground } from "@/components/landing/CinematicBackground";
import { MedOneXLogoMark } from "@/components/branding/MedQsLogo";

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

export default function DownloadPage() {
  return (
    <div className="relative min-h-screen selection:bg-primary/30 selection:text-white transition-colors duration-500">
      <CinematicBackground />
      <LandingNavbar />

      {/* ── Hero ── */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        <div className="mx-auto max-w-7xl text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold text-primary uppercase tracking-widest animate-fade-in mb-8">
            <Sparkles className="h-3 w-3" />
            Version {APP_VERSION}
          </div>

          <h1 className="text-5xl sm:text-7xl font-black tracking-tighter text-slate-900 dark:text-white mb-6 leading-[0.95]">
            Get the{" "}
            <span className="bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent">
              MedOneX
            </span>{" "}
            App
          </h1>

          <p className="mx-auto max-w-2xl text-lg text-slate-600 dark:text-white/60 leading-relaxed mb-12">
            Take your medical studies anywhere. The full MedOneX experience optimized for your phone and tablet.
          </p>

          {/* Download Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <a
              href={APK_URL}
              download
              className="group h-16 w-full sm:w-auto flex items-center justify-center px-10 rounded-2xl bg-gradient-to-r from-primary to-blue-600 text-lg font-bold text-white shadow-2xl shadow-primary/40 hover:scale-105 active:scale-95 transition-all"
            >
              <Download className="mr-3 h-6 w-6 group-hover:-translate-y-1 transition-transform" />
              Download for Android
            </a>
            <div className="h-16 w-full sm:w-auto flex items-center justify-center px-10 rounded-2xl bg-slate-200/50 dark:bg-white/5 border border-slate-300 dark:border-white/10 text-lg font-bold text-slate-400 dark:text-white/30 cursor-not-allowed">
              <Smartphone className="mr-3 h-6 w-6" />
              iOS — Coming Soon
            </div>
          </div>

          <p className="text-sm text-slate-400 dark:text-white/40 mb-16">
            APK · {APP_VERSION} · ~25 MB · Android 8.0+
          </p>

          {/* Phone Mockups */}
          <div className="relative mx-auto max-w-5xl">
            <div className="absolute inset-0 bg-primary/10 blur-[100px] -z-10" />
            <div className="flex justify-center gap-6">
              <div className="w-64 rounded-[40px] border-4 border-slate-700 dark:border-white/20 bg-slate-900 dark:bg-black shadow-2xl overflow-hidden">
                <div className="h-6 bg-slate-800 dark:bg-white/10 flex items-center justify-center">
                  <div className="w-20 h-1.5 rounded-full bg-slate-600 dark:bg-white/30" />
                </div>
                <div className="aspect-[9/19] bg-gradient-to-b from-slate-800 to-slate-900 dark:from-gray-900 dark:to-black flex items-center justify-center p-4">
                  <div className="text-center">
                    <MedOneXLogoMark className="h-12 w-12 mx-auto mb-4 text-primary" />
                    <p className="text-white font-black text-lg">MedOneX</p>
                    <p className="text-white/40 text-xs mt-1">v{APP_VERSION}</p>
                  </div>
                </div>
              </div>
              <div className="hidden md:block w-64 rounded-[40px] border-4 border-slate-700 dark:border-white/20 bg-slate-900 dark:bg-black shadow-2xl overflow-hidden translate-y-8">
                <div className="h-6 bg-slate-800 dark:bg-white/10 flex items-center justify-center">
                  <div className="w-20 h-1.5 rounded-full bg-slate-600 dark:bg-white/30" />
                </div>
                <div className="aspect-[9/19] bg-gradient-to-b from-slate-800 to-slate-900 dark:from-gray-900 dark:to-black flex items-center justify-center p-4">
                  <div className="w-full space-y-3">
                    <div className="h-4 w-3/4 rounded-full bg-primary/30" />
                    <div className="h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center px-4">
                      <div className="w-8 h-8 rounded-lg bg-primary/30 mr-3" />
                      <div className="flex-1">
                        <div className="h-2.5 w-20 rounded-full bg-white/20 mb-1" />
                        <div className="h-2 w-12 rounded-full bg-white/10" />
                      </div>
                    </div>
                    <div className="h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center px-4">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/30 mr-3" />
                      <div className="flex-1">
                        <div className="h-2.5 w-16 rounded-full bg-white/20 mb-1" />
                        <div className="h-2 w-10 rounded-full bg-white/10" />
                      </div>
                    </div>
                    <div className="h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center px-4">
                      <div className="w-8 h-8 rounded-lg bg-purple-500/30 mr-3" />
                      <div className="flex-1">
                        <div className="h-2.5 w-24 rounded-full bg-white/20 mb-1" />
                        <div className="h-2 w-14 rounded-full bg-white/10" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="py-16 px-6 border-y border-slate-200 dark:border-white/5 bg-slate-100/50 dark:bg-white/[0.02]">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: "5K+", label: "Downloads" },
              { value: "4.8", label: "App Rating", sub: "⭐" },
              { value: "25MB", label: "App Size" },
              { value: "99.9%", label: "Uptime" },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mb-2">{stat.value}</p>
                <p className="text-sm font-bold text-slate-400 dark:text-white/40 uppercase tracking-widest">{stat.label}</p>
                {stat.sub && <p className="text-lg mt-1">{stat.sub}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-24 px-6">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white mb-4">
              Everything in Your Pocket
            </h2>
            <p className="text-lg text-slate-500 dark:text-white/50 max-w-xl mx-auto">
              The same powerful platform, now mobile-native.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature, i) => (
              <div
                key={i}
                className="group p-8 rounded-3xl bg-slate-100/50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 hover:border-primary/50 hover:bg-white dark:hover:bg-white/[0.06] transition-all duration-500 shadow-sm hover:shadow-xl"
              >
                <div className="w-12 h-12 rounded-2xl bg-white dark:bg-white/5 flex items-center justify-center mb-6 shadow-sm text-primary">
                  <feature.icon size={24} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3">{feature.title}</h3>
                <p className="text-slate-500 dark:text-white/50 leading-relaxed text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How to Install ── */}
      <section className="py-24 px-6 bg-slate-100/50 dark:bg-white/[0.02] border-y border-slate-200 dark:border-white/5">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white mb-4">
              How to Install
            </h2>
            <p className="text-lg text-slate-500 dark:text-white/50">Just 3 simple steps</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Download APK", desc: "Tap the download button above to get the APK file" },
              { step: "02", title: "Allow Installation", desc: "Go to Settings > Security > enable 'Unknown Sources'" },
              { step: "03", title: "Install & Go", desc: "Open the APK and install. Sign in with your account" },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black text-2xl mx-auto mb-6 shadow-sm">
                  {item.step}
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3">{item.title}</h3>
                <p className="text-sm text-slate-500 dark:text-white/50">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Auto-Update Section ── */}
      <section className="py-20 px-6">
        <div className="mx-auto max-w-4xl p-8 sm:p-12 rounded-[48px] bg-gradient-to-br from-primary/5 to-blue-500/5 border border-primary/20 text-center">
          <Zap className="h-12 w-12 text-primary mx-auto mb-6" />
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mb-4">
            Automatic Updates
          </h2>
          <p className="text-lg text-slate-500 dark:text-white/60 max-w-lg mx-auto mb-8 leading-relaxed">
            No more manual downloads. The app updates itself automatically — just like Telegram or WhatsApp. Any UI improvements reach you instantly.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {["OTA Enabled", "No App Store", "Instant Delivery", "Zero Effort"].map((tag) => (
              <span key={tag} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold text-primary">
                <CheckCircle2 className="h-3 w-3" />
                {tag}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 px-6 text-center">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white mb-6">
            Start on Web, Continue on Mobile
          </h2>
          <p className="text-lg text-slate-500 dark:text-white/60 mb-10 max-w-lg mx-auto">
            All your progress syncs automatically. Study anywhere, anytime.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="group h-14 w-full sm:w-auto flex items-center justify-center px-8 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold hover:scale-105 transition-all"
            >
              Get Started Free
              <ChevronRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a
              href={APK_URL}
              download
              className="h-14 w-full sm:w-auto flex items-center justify-center px-8 rounded-2xl bg-primary/10 border border-primary/20 text-primary font-bold hover:bg-primary/20 hover:scale-105 transition-all"
            >
              <Download className="mr-2 h-5 w-5" />
              Download APK
            </a>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-16 px-6 border-t border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-transparent">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <MedOneXLogoMark className="h-8 w-8 text-primary" />
              <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">MedOneX</span>
            </Link>
            <div className="flex flex-wrap justify-center gap-6 text-sm font-bold text-slate-400 dark:text-white/40">
              <Link href="/" className="hover:text-primary transition-colors">Home</Link>
              <Link href="/#features" className="hover:text-primary transition-colors">Features</Link>
              <Link href="/privacy" className="hover:text-primary transition-colors">Privacy</Link>
              <span className="text-slate-300 dark:text-white/20">v{APP_VERSION}</span>
            </div>
          </div>
          <div className="mt-10 pt-8 border-t border-slate-200 dark:border-white/5 text-center text-sm text-slate-400 dark:text-white/20">
            © 2026 MedOneX. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}