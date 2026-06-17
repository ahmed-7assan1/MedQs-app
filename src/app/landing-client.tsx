"use client";

import { useEffect, useState, useRef } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import {
  ArrowRight, Play, Check, Star, Menu, X,
  Brain, BookOpen, Layers, Target, MessageSquare, Clock,
  Zap, Shield, BarChart3, Users, Sparkles, ChevronRight,
  TrendingUp, GraduationCap, Award, HeartHandshake,
  Monitor, Smartphone, Tablet, Eye, Bot, Download,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { NAV_LINKS, FEATURES, BENTO_ITEMS, TESTIMONIALS, PRICING_PLANS, FOOTER_LINKS, ACCENT, ACCENT2, PURPLE } from "./landing-data";

function useScrollReveal(threshold = 0.1) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px", amount: threshold });
  return { ref, isInView };
}

function FadeUp({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
  const { ref, isInView } = useScrollReveal();
  return (
    <div ref={ref} className={className}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
        transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.div>
    </div>
  );
}

function StaggerChildren({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const { ref, isInView } = useScrollReveal(0.05);
  return (
    <div ref={ref}>
      <motion.div
        className={className}
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
        variants={{ visible: { transition: { staggerChildren: 0.1, delayChildren: delay } }, hidden: {} }}
      >
        {children}
      </motion.div>
    </div>
  );
}

function StaggerItem({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } } }}
    >
      {children}
    </motion.div>
  );
}

function CountUp({ target, suffix = "", delay = 0 }: { target: number; suffix?: string; delay?: number }) {
  const [count, setCount] = useState(0);
  const { ref, isInView } = useScrollReveal();
  useEffect(() => {
    if (!isInView) return;
    const timer = setTimeout(() => {
      const duration = 2000;
      const steps = 60;
      let current = 0;
      const increment = target / steps;
      const interval = setInterval(() => {
        current += increment;
        if (current >= target) { setCount(target); clearInterval(interval); }
        else setCount(Math.floor(current));
      }, duration / steps);
      return () => clearInterval(interval);
    }, delay * 1000);
    return () => clearTimeout(timer);
  }, [isInView, target, delay]);
  return <span ref={ref}>{count}{suffix}</span>;
}

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className={cn(
      "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
      scrolled ? "bg-[#0A0E1A]/80 backdrop-blur-xl border-b border-white/5" : "bg-transparent"
    )}>
      <nav className="mx-auto max-w-7xl flex items-center justify-between px-6 h-16 md:h-20">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00FF88] to-[#00D4FF] flex items-center justify-center">
            <Brain className="w-4 h-4 text-[#0A0E1A]" />
          </div>
          <span className="text-lg font-bold text-white tracking-tight">MedOneX</span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href} className="text-sm font-medium text-gray-400 hover:text-white transition-colors">
              {link.label}
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Link href="/login" className="text-sm font-medium text-gray-400 hover:text-white transition-colors px-4">Sign In</Link>
          <Link
            href="/download"
            className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-[#00FF88] to-[#00D4FF] hover:shadow-lg hover:shadow-[#00FF88]/30 transition-all duration-300"
          >
            Download App <Download className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
          </Link>
          <Link
            href="/register"
            className="relative group inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-[#00FF88] to-[#00D4FF] hover:shadow-lg hover:shadow-[#00FF88]/30 transition-all duration-300"
          >
            Get Started Free <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 text-white/60 hover:text-white"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </nav>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-[#0A0E1A]/95 backdrop-blur-xl border-t border-white/5"
          >
            <div className="px-6 py-6 space-y-4">
              {NAV_LINKS.map((link) => (
                <a key={link.href} href={link.href} onClick={() => setMobileOpen(false)} className="block text-sm font-medium text-gray-400 hover:text-white transition-colors">{link.label}</a>
              ))}
              <div className="pt-4 border-t border-white/5 space-y-3">
                <Link href="/login" className="block text-center text-sm font-medium text-gray-400 hover:text-white">Sign In</Link>
                <Link href="/download" onClick={() => setMobileOpen(false)} className="block text-center text-sm font-medium text-white bg-white/10 hover:bg-white/20 py-2 rounded-xl">Download App</Link>
                <Link
                  href="/register"
                  onClick={() => setMobileOpen(false)}
                  className="block text-center px-5 py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-[#00FF88] to-[#00D4FF]"
                >
                  Get Started Free <ArrowRight className="w-4 h-4 inline ml-1" />
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

function HeroSection() {
  return (
    <section className="relative min-h-screen pt-24 md:pt-0 flex items-center overflow-hidden">
      <div className="absolute inset-0 bg-[#0A0E1A]">
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(0,255,136,0.08) 0%, transparent 50%)' }} />
        <div className="absolute top-1/2 right-1/4 w-[600px] h-[600px] bg-purple-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0A0E1A] to-transparent" />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 py-20 md:py-32">
        <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#00FF88]/10 border border-[#00FF88]/20 text-xs font-semibold text-[#00FF88] mb-8"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Trusted by 10,000+ medical students
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tighter leading-[0.95] text-white mb-6"
            >
              Master Medicine{" "}
              <span className="bg-gradient-to-r from-[#00FF88] to-[#00D4FF] bg-clip-text text-transparent">
                Faster. Smarter.
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg text-gray-400 leading-relaxed max-w-lg mb-10"
            >
              The AI-powered platform that adapts to your curriculum. Personalized learning paths, real-time analytics, and your personal AI tutor—all in one place.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 mb-10"
            >
              <Link
                href="/register"
                className="group h-14 px-8 inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#00FF88] to-[#00D4FF] text-[#0A0E1A] font-bold text-base hover:shadow-lg hover:shadow-[#00FF88]/30 transition-all duration-300 hover:scale-[1.02]"
              >
                Start for Free <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="#demo"
                className="h-14 px-8 inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 text-white font-medium text-base hover:bg-white/5 transition-all"
              >
                <Play className="w-5 h-5" /> Watch Demo
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex items-center gap-4"
            >
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-[#0A0E1A] bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center text-xs font-bold text-white">
                    {String.fromCharCode(64 + i)}
                  </div>
                ))}
              </div>
              <div>
                <div className="flex items-center gap-1 mb-0.5">
                  {[1, 2, 3, 4, 5].map((s) => <Star key={s} className="w-4 h-4 fill-yellow-500 text-yellow-500" />)}
                </div>
                <p className="text-xs text-gray-400">Loved by 10K+ students</p>
              </div>
            </motion.div>
          </div>

          <div className="relative hidden md:block">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="relative"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[#00FF88]/20 to-purple-600/20 blur-[80px] rounded-[32px]" />
              <div className="relative rounded-[32px] border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] p-2 shadow-2xl">
                <div className="rounded-[24px] overflow-hidden bg-[#0A0E1A] aspect-[4/3] flex items-center justify-center">
                  <div className="text-center p-8">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00FF88]/10 border border-[#00FF88]/20 text-xs font-semibold text-[#00FF88] mb-4">AI-Powered</div>
                    <Brain className="w-16 h-16 mx-auto text-[#00FF88] mb-4 opacity-80" />
                    <p className="text-gray-400 text-sm">Your personal AI tutor is ready</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

function DownloadSection() {
  return (
    <section className="py-24 px-6">
      <div className="mx-auto max-w-5xl">
        <FadeUp>
          <div className="relative p-8 md:p-16 rounded-[32px] bg-gradient-to-br from-[#111827] to-[#0A0E1A] border border-[#1F2937] overflow-hidden text-center">
            <div className="absolute inset-0 bg-gradient-to-br from-[#00FF88]/5 to-blue-500/5" />
            <div className="relative">
              <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white mb-6">
                Get the <span className="bg-gradient-to-r from-[#00FF88] to-[#00D4FF] bg-clip-text text-transparent">MedOneX</span> App
              </h2>
              <p className="text-lg text-gray-400 max-w-xl mx-auto mb-10 leading-relaxed">
                Take your medical studies anywhere. The full MedOneX experience optimized for your phone and tablet.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <a
                  href="/download"
                  className="group h-14 px-10 inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#00FF88] to-[#00D4FF] text-[#0A0E1A] font-bold text-base hover:shadow-lg hover:shadow-[#00FF88]/30 transition-all duration-300 hover:scale-[1.02]"
                >
                  <Download className="w-5 h-5 group-hover:translate-y-0.5 transition-transform" />
                  Download for Android
                </a>
                <div className="h-14 w-full sm:w-auto flex items-center justify-center px-10 rounded-2xl bg-white/5 border border-white/10 text-lg font-bold text-gray-400 cursor-not-allowed">
                  <Smartphone className="mr-3 h-6 w-6" />
                  iOS — Coming Soon
                </div>
              </div>
              <p className="mt-6 text-sm text-gray-400">
                APK · v1.0.0 · ~25 MB · Android 8.0+
              </p>
            </div>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}

function LogosBar() {
  return (
    <section className="py-16 px-6">
      <div className="mx-auto max-w-6xl text-center">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-8">Trusted by students at</p>
        <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6 opacity-40">
          {["Cairo University", "Ain Shams", "Alexandria", "Mansoura", "Assiut", "Zagazig"].map((name) => (
            <div key={name} className="flex items-center gap-2 text-sm font-bold text-gray-400">
              <GraduationCap className="w-4 h-4" /> {name}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  return (
    <section id="features" className="py-24 px-6">
      <div className="mx-auto max-w-6xl">
        <FadeUp>
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#00FF88]/10 border border-[#00FF88]/20 text-xs font-semibold text-[#00FF88] mb-4">Everything you need</span>
            <h2 className="text-3xl md:text-5xl font-black text-white mt-4 tracking-tight">Built for <span className="bg-gradient-to-r from-[#00FF88] to-[#00D4FF] bg-clip-text text-transparent">Medical Students</span></h2>
            <p className="text-gray-400 text-lg mt-4 max-w-2xl mx-auto">From AI tutoring to past papers—all in one seamless experience designed around your curriculum.</p>
          </div>
        </FadeUp>

        <StaggerChildren className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f) => (
            <StaggerItem key={f.title}>
              <div className="group p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-white/10 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 text-lg" style={{ background: `${f.color}15`, color: f.color }}>
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{f.desc}</p>
              </div>
            </StaggerItem>
          ))}
        </StaggerChildren>
      </div>
    </section>
  );
}

function BentoSection() {
  return (
    <section className="py-24 px-6">
      <div className="mx-auto max-w-6xl">
        <FadeUp>
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-xs font-semibold text-purple-400 mb-4">Real Results</span>
            <h2 className="text-3xl md:text-5xl font-black text-white mt-4 tracking-tight">Numbers That <span className="bg-gradient-to-r from-[#00FF88] to-[#00D4FF] bg-clip-text text-transparent">Speak</span></h2>
            <p className="text-gray-400 text-lg mt-4 max-w-2xl mx-auto">Our platform delivers measurable results for medical students across every major university.</p>
          </div>
        </FadeUp>

        <div className="grid md:grid-cols-3 gap-5">
          {BENTO_ITEMS.map((item, i) => (
            <FadeUp key={item.title} delay={i * 0.1}>
              <div className="relative p-8 rounded-[24px] border border-white/5 bg-gradient-to-br from-white/[0.02] to-white/[0.01] overflow-hidden group hover:border-white/10 transition-all duration-500">
                <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full opacity-20 group-hover:opacity-30 transition-opacity duration-500" style={{ background: `radial-gradient(circle, ${item.color}40, transparent)` }} />
                <div className="relative">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: `${item.color}20`, color: item.color }}>
                    <item.icon className="w-6 h-6" />
                  </div>
                  <div className="text-4xl font-black text-white mb-1">{item.stat}</div>
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">{item.statLabel}</div>
                  <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}

function StatsSection() {
  return (
    <section className="py-24 px-6">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 p-8 md:p-12 rounded-[32px] bg-gradient-to-br from-[#111827] to-[#0A0E1A] border border-[#1F2937]">
          {[
            { target: 10000, suffix: "+", label: "Active Students" },
            { target: 50000, suffix: "+", label: "MCQ Questions" },
            { target: 500, suffix: "+", label: "Video Lectures" },
            { target: 97, suffix: "%", label: "Student Satisfaction" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl md:text-4xl font-black text-white mb-1">
                <CountUp target={stat.target} suffix={stat.suffix} />
              </div>
              <div className="text-xs text-gray-400 font-medium">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialsSection() {
  return (
    <section className="py-24 px-6">
      <div className="mx-auto max-w-6xl">
        <FadeUp>
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#00FF88]/10 border border-[#00FF88]/20 text-xs font-semibold text-[#00FF88] mb-4">Testimonials</span>
            <h2 className="text-3xl md:text-5xl font-black text-white mt-4 tracking-tight">What <span className="bg-gradient-to-r from-[#00FF88] to-[#00D4FF] bg-clip-text text-transparent">Students</span> Say</h2>
            <p className="text-gray-400 text-lg mt-4 max-w-2xl mx-auto">Join thousands of medical students who have transformed their study experience.</p>
          </div>
        </FadeUp>

        <div className="grid md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, i) => (
            <FadeUp key={t.name} delay={i * 0.1}>
              <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all duration-300">
                <div className="flex items-center gap-1 mb-3">
                  {Array.from({ length: t.rating }).map((_, s) => <Star key={s} className="w-4 h-4 fill-yellow-500 text-yellow-500" />)}
                </div>
                <p className="text-sm text-gray-300 leading-relaxed mb-4">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00FF88] to-[#00D4FF] flex items-center justify-center text-sm font-bold text-[#0A0E1A]">{t.initials}</div>
                  <div>
                    <div className="text-sm font-semibold text-white">{t.name}</div>
                    <div className="text-xs text-gray-400">{t.role}</div>
                  </div>
                </div>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}

function PricingSection() {
  return (
    <section id="pricing" className="py-24 px-6">
      <div className="mx-auto max-w-6xl">
        <FadeUp>
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#00FF88]/10 border border-[#00FF88]/20 text-xs font-semibold text-[#00FF88] mb-4">Pricing</span>
            <h2 className="text-3xl md:text-5xl font-black text-white mt-4 tracking-tight">Free for <span className="bg-gradient-to-r from-[#00FF88] to-[#00D4FF] bg-clip-text text-transparent">Everyone</span></h2>
            <p className="text-gray-400 text-lg mt-4 max-w-2xl mx-auto">No paywalls. No hidden fees. Medical education should be accessible to all.</p>
          </div>
        </FadeUp>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {PRICING_PLANS.map((plan, i) => (
            <FadeUp key={plan.name} delay={i * 0.1}>
              <div className={cn(
                "relative p-8 rounded-2xl border transition-all duration-300",
                plan.popular
                  ? "bg-gradient-to-br from-[#00FF88]/10 via-[#00D4FF]/5 to-transparent border-[#00FF88]/30"
                  : "bg-white/[0.02] border-white/5 hover:border-white/10"
              )}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-[#00FF88] to-[#00D4FF] text-[10px] font-bold text-[#0A0E1A] uppercase tracking-wider">
                    Most Popular
                  </div>
                )}
                <div className="text-lg font-bold text-white mb-1">{plan.name}</div>
                <div className="text-4xl font-black text-white mb-2">{plan.price}</div>
                <p className="text-sm text-gray-400 mb-6">{plan.description}</p>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-3 text-sm text-gray-300">
                      <Check className="w-4 h-4 text-[#00FF88] mt-0.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className={cn(
                    "block w-full text-center py-3 rounded-xl text-sm font-bold transition-all",
                    plan.popular
                      ? "bg-gradient-to-r from-[#00FF88] to-[#00D4FF] text-[#0A0E1A] hover:shadow-lg hover:shadow-[#00FF88]/30"
                      : "border border-white/10 text-white hover:bg-white/5"
                  )}
                >
                  {plan.cta}
                </Link>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}

function FooterSection() {
  return (
    <footer className="py-16 px-6 border-t border-white/5">
      <div className="mx-auto max-w-6xl">
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          <div>
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00FF88] to-[#00D4FF] flex items-center justify-center">
                <Brain className="w-4 h-4 text-[#0A0E1A]" />
              </div>
              <span className="text-lg font-bold text-white tracking-tight">MedOneX</span>
            </Link>
            <p className="text-sm text-gray-400 leading-relaxed max-w-xs">
              AI-powered medical education platform. Study smarter, not harder.
            </p>
          </div>

          {Object.entries(FOOTER_LINKS).map(([category, links]) => (
            <div key={category}>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">{category}</h3>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-sm text-gray-400 hover:text-gray-300 transition-colors">{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-400">© 2026 MedOneX. All rights reserved.</p>
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <Link href="/founders" className="hover:text-gray-300 transition-colors">Made with ❤️ by the MedOneX Team</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function LandingPageContent() {
  return (
    <div className="bg-[#0A0E1A] text-white min-h-screen">
      <Navbar />
      <HeroSection />
      <DownloadSection />
      <LogosBar />
      <FeaturesSection />
      <BentoSection />
      <StatsSection />
      <TestimonialsSection />
      <PricingSection />
      <FooterSection />

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
