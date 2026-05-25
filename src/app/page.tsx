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

/* ─── Constants ─── */
const ACCENT = "#00FF88";
const ACCENT2 = "#00D4FF";
const PURPLE = "#7C3AED";

const NAV_LINKS = [
  { href: "#features", label: "Features" },
  { href: "#pricing", label: "Pricing" },
  { href: "#about", label: "About" },
  { href: "#blog", label: "Blog" },
];

const FEATURES = [
  { icon: Brain, title: "AI-Powered Learning", desc: "Adaptive algorithms that identify your weak areas and personalize your study path in real-time.", color: "#00FF88" },
  { icon: Layers, title: "Curated Curriculum", desc: "Structured content mapped to your exact university syllabus with module-by-module progression.", color: "#00D4FF" },
  { icon: Target, title: "Smart Analytics", desc: "Track your mastery with precision. Know exactly what you've covered and what needs review.", color: "#7C3AED" },
  { icon: BookOpen, title: "50K+ MCQ Bank", desc: "Massive repository of past exam questions with detailed AI-generated explanations for every answer.", color: "#F59E0B" },
  { icon: MessageSquare, title: "Medical Community", desc: "Connect with peers and doctors in moderated forums. Share insights and study together.", color: "#EF4444" },
  { icon: Clock, title: "Spaced Repetition", desc: "Built-in flashcard system using proven memory techniques for long-term clinical retention.", color: "#10B981" },
];

const BENTO_ITEMS = [
  { icon: Brain, title: "AI Tutor Available 24/7", desc: "Ask Dr. Q anything. It understands your curriculum and explains concepts like a senior doctor.", color: ACCENT, stat: "99.9%", statLabel: "Uptime" },
  { icon: BarChart3, title: "Real-time Progress", desc: "See your mastery score grow with every lecture, quiz, and flashcard session.", color: ACCENT2, stat: "2.5x", statLabel: "Faster Learning" },
  { icon: TrendingUp, title: "Exam Pass Rate", desc: "Students using MedOneX consistently score higher. Our data speaks for itself.", color: PURPLE, stat: "94%", statLabel: "Pass Rate" },
];

const TESTIMONIALS = [
  { name: "Dr. Sara Ahmed", role: "Cairo University", quote: "MedOneX completely transformed how I prepare for exams. The AI explanations are better than any textbook.", rating: 5, initials: "SA" },
  { name: "Ahmed Hassan", role: "Ain Shams University", quote: "The spaced repetition system is a game-changer. I retained 3x more information in half the study time.", rating: 5, initials: "AH" },
  { name: "Laila Mohamed", role: "Alexandria University", quote: "Having the entire curriculum organized with AI assistance feels like having a personal tutor 24/7.", rating: 5, initials: "LM" },
];

const PRICING_PLANS = [
  {
    name: "Starter", price: "Free", description: "Perfect for exploring what MedOneX offers.",
    features: ["Basic MCQ access", "Community forums", "Progress tracking", "Limited AI queries"],
    cta: "Get Started Free", popular: false,
  },
  {
    name: "Pro", price: "Free", description: "For serious students committed to excellence.",
    features: ["Unlimited MCQ access", "Full AI assistant", "Spaced repetition", "Analytics dashboard", "Offline access", "Priority support"],
    cta: "Start Pro Trial", popular: true,
  },
  {
    name: "Enterprise", price: "Free", description: "For institutions and study groups.",
    features: ["Everything in Pro", "Team management", "Custom curriculum", "API access", "Dedicated support", "Bulk enrollment"],
    cta: "Contact Sales", popular: false,
  },
];

/* ─── Animation Hooks ─── */
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

/* ─── Navbar ─── */
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
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00FF88] to-[#00D4FF] flex items-center justify-center">
            <Brain className="w-4 h-4 text-[#0A0E1A]" />
          </div>
          <span className="text-lg font-bold text-white tracking-tight">MedOneX</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href} className="text-sm font-medium text-gray-400 hover:text-white transition-colors">
              {link.label}
            </a>
          ))}
        </div>

        {/* Desktop CTA */}
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

        {/* Mobile Toggle */}
        <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 text-white/60 hover:text-white">
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </nav>

      {/* Mobile Menu */}
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

/* ─── Hero ─── */
function HeroSection() {
  return (
    <section className="relative min-h-screen pt-24 md:pt-0 flex items-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-[#0A0E1A]">
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(0,255,136,0.08) 0%, transparent 50%)' }} />
        <div className="absolute top-1/2 right-1/4 w-[600px] h-[600px] bg-purple-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0A0E1A] to-transparent" />
        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 py-20 md:py-32">
        <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
          {/* Left Content */}
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

            {/* Social Proof */}
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
                  {[1, 2, 3, 4, 5].map((i) => (<Star key={i} className="w-4 h-4 fill-[#00FF88] text-[#00FF88]" />))}
                </div>
                <p className="text-sm text-gray-500">Join 50K+ medical professionals</p>
              </div>
            </motion.div>
          </div>

          {/* Right Visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#00FF88]/20 via-[#00D4FF]/10 to-purple-600/20 blur-[100px] rounded-full" />
            <div className="relative animate-float">
              <div className="rounded-[24px] bg-[#111827]/80 backdrop-blur-xl border border-[#1F2937] p-6 shadow-2xl shadow-black/50">
                {/* Dashboard Mockup */}
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <div className="ml-4 flex-1 h-6 rounded-lg bg-white/5 border border-white/10 flex items-center px-3">
                    <span className="text-[10px] text-gray-500">dashboard.medonex.com</span>
                  </div>
                </div>

                {/* Mini Chart */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-[#00FF88]/10 to-transparent border border-[#00FF88]/20">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Mastery</p>
                    <p className="text-2xl font-black text-white">87%</p>
                    <div className="mt-2 h-1.5 rounded-full bg-[#00FF88]/20 overflow-hidden">
                      <div className="h-full w-[87%] rounded-full bg-gradient-to-r from-[#00FF88] to-[#00D4FF]" />
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500/10 to-transparent border border-purple-500/20">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Streak</p>
                    <p className="text-2xl font-black text-white">12🔥</p>
                    <p className="text-xs text-gray-500 mt-1">Personal best!</p>
                  </div>
                </div>

                {/* Activity List */}
                <div className="space-y-2">
                  {[
                    { label: "Cardiovascular System", pct: 75, color: ACCENT },
                    { label: "Neurology", pct: 45, color: ACCENT2 },
                    { label: "Respiratory", pct: 90, color: PURPLE },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-white truncate">{item.label}</p>
                        <div className="mt-1.5 h-1.5 rounded-full bg-white/5 overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${item.pct}%`, backgroundColor: item.color }} />
                        </div>
                      </div>
                      <span className="text-xs font-bold text-white/60">{item.pct}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ─── Logos Bar ─── */
function LogosBar() {
  const logos = ["Cairo University", "Ain Shams", "Alexandria", "Mansoura", "Tanta", "Assiut", "Zagazig"];
  return (
    <section className="py-12 border-y border-white/5 bg-white/[0.02]">
      <div className="mx-auto max-w-7xl px-6">
        <p className="text-center text-xs font-semibold text-gray-500 uppercase tracking-[0.2em] mb-8">Trusted by students at</p>
        <div className="flex overflow-hidden">
          <motion.div
            animate={{ x: ["0%", "-50%"] }}
            transition={{ duration: 30, ease: "linear", repeat: Infinity }}
            className="flex gap-16 items-center"
          >
            {[...logos, ...logos].map((name, i) => (
              <span key={i} className="text-lg font-bold text-gray-500/60 hover:text-gray-300 transition-colors whitespace-nowrap cursor-default">{name}</span>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ─── Features ─── */
function FeaturesSection() {
  return (
    <section id="features" className="py-24 md:py-32 px-6">
      <div className="mx-auto max-w-7xl">
        <FadeUp className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#00FF88]/10 border border-[#00FF88]/20 text-xs font-semibold text-[#00FF88] mb-6">
            <Zap className="w-3.5 h-3.5" /> FEATURES
          </div>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-4">
            Everything You Need to{" "}
            <span className="bg-gradient-to-r from-[#00FF88] to-[#00D4FF] bg-clip-text text-transparent">Excel</span>
          </h2>
          <p className="text-gray-400 max-w-xl mx-auto">Built specifically for medical students by medical educators. Every feature is designed to maximize retention.</p>
        </FadeUp>

        <StaggerChildren className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f) => (
            <StaggerItem key={f.title}>
              <div className="group p-8 rounded-2xl bg-[#111827] border border-[#1F2937] hover:border-[#00FF88]/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-[#00FF88]/5">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5" style={{ backgroundColor: f.color + "15", border: `1px solid ${f.color}25` }}>
                  <f.icon className="w-6 h-6" style={{ color: f.color }} />
                </div>
                <h3 className="text-lg font-bold text-white mb-3">{f.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{f.desc}</p>
              </div>
            </StaggerItem>
          ))}
        </StaggerChildren>
      </div>
    </section>
  );
}

/* ─── Bento Grid ─── */
function BentoSection() {
  return (
    <section className="py-24 md:py-32 px-6 bg-[#0A0E1A]">
      <div className="mx-auto max-w-7xl">
        <FadeUp className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-4">See It in{" "}
            <span className="bg-gradient-to-r from-[#00FF88] to-[#00D4FF] bg-clip-text text-transparent">Action</span>
          </h2>
          <p className="text-gray-400 max-w-xl mx-auto">A peek inside the platform that's changing how medical students study.</p>
        </FadeUp>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Large card */}
          <FadeUp className="md:col-span-2 relative">
            <div className="rounded-2xl bg-gradient-to-br from-[#111827] to-[#0A0E1A] border border-[#1F2937] p-6 md:p-8 min-h-[300px] flex flex-col relative overflow-hidden group hover:border-[#00D4FF]/30 transition-all duration-300">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#00D4FF]/10 to-purple-600/10 blur-[80px] rounded-full" />
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-[#00D4FF]/15 border border-[#00D4FF]/25 flex items-center justify-center">
                  <Smartphone className="w-6 h-6 text-[#00D4FF]" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Full Mobile Experience</h3>
                  <p className="text-sm text-gray-400">Native iOS & Android apps</p>
                </div>
              </div>
              <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-3">
                {["Dashboard", "Lectures", "Quizzes", "AI Chat", "Progress", "Community"].map((item) => (
                  <div key={item} className="flex items-center gap-2 p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/5 transition-colors">
                    <div className="w-2 h-2 rounded-full bg-[#00D4FF]" />
                    <span className="text-xs font-medium text-gray-300">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </FadeUp>

          {/* Smaller cards */}
          {BENTO_ITEMS.map((item, i) => (
            <FadeUp key={item.title} delay={i * 0.1}>
              <div className="rounded-2xl bg-[#111827] border border-[#1F2937] p-6 min-h-[220px] flex flex-col group hover:border-[#00FF88]/20 transition-all duration-300">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: item.color + "15" }}>
                  <item.icon className="w-5 h-5" style={{ color: item.color }} />
                </div>
                <h3 className="text-base font-bold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-gray-400 flex-1">{item.desc}</p>
                <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                  <span className="text-2xl font-black text-white">{item.stat}</span>
                  <span className="text-xs text-gray-500">{item.statLabel}</span>
                </div>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Stats ─── */
function StatsSection() {
  const stats = [
    { value: 50000, suffix: "+", label: "Active Students" },
    { value: 100000, suffix: "+", label: "Questions Answered" },
    { value: 99, suffix: ".9%", label: "Platform Uptime" },
    { value: 94, suffix: "%", label: "Exam Pass Rate" },
  ];
  return (
    <section className="py-20 px-6 bg-gradient-to-b from-[#0A0E1A] to-[#111827] border-y border-white/5">
      <div className="mx-auto max-w-7xl">
        <StaggerChildren className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {stats.map((s, i) => (
            <StaggerItem key={s.label}>
              <div className="text-center">
                <p className="text-4xl md:text-5xl font-black text-white mb-2">
                  <CountUp target={s.value} suffix={s.suffix} delay={i * 0.2} />
                </p>
                <p className="text-sm text-gray-500 font-medium">{s.label}</p>
              </div>
            </StaggerItem>
          ))}
        </StaggerChildren>
      </div>
    </section>
  );
}

/* ─── Testimonials ─── */
function TestimonialsSection() {
  return (
    <section className="py-24 md:py-32 px-6">
      <div className="mx-auto max-w-7xl">
        <FadeUp className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-4">Loved by{" "}
            <span className="bg-gradient-to-r from-[#00FF88] to-[#00D4FF] bg-clip-text text-transparent">Students</span>
          </h2>
          <p className="text-gray-400 max-w-xl mx-auto">Hear from the thousands of medical students who have transformed their study habits.</p>
        </FadeUp>

        <StaggerChildren className="grid md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, i) => (
            <StaggerItem key={t.name}>
              <div className="p-8 rounded-2xl bg-[#111827] border border-[#1F2937] hover:border-[#00FF88]/20 transition-all duration-300 group">
                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: t.rating }).map((_, i) => (<Star key={i} className="w-4 h-4 fill-yellow-500 text-yellow-500" />))}
                </div>
                <p className="text-sm text-gray-300 leading-relaxed mb-6 italic">"{t.quote}"</p>
                <div className="flex items-center gap-3 pt-4 border-t border-white/5">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00FF88] to-[#00D4FF] flex items-center justify-center text-xs font-bold text-[#0A0E1A]">{t.initials}</div>
                  <div>
                    <p className="text-sm font-semibold text-white">{t.name}</p>
                    <p className="text-xs text-gray-500">{t.role}</p>
                  </div>
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerChildren>
      </div>
    </section>
  );
}

/* ─── Pricing ─── */
function PricingSection() {
  const [annual, setAnnual] = useState(false);

  return (
    <section id="pricing" className="py-24 md:py-32 px-6 bg-[#0A0E1A] border-y border-white/5">
      <div className="mx-auto max-w-7xl">
        <FadeUp className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-4">
            Simple{" "}
            <span className="bg-gradient-to-r from-[#00FF88] to-[#00D4FF] bg-clip-text text-transparent">Pricing</span>
          </h2>
          <p className="text-gray-400 max-w-xl mx-auto mb-8">Start free. Upgrade when you need more.</p>
        </FadeUp>

        <StaggerChildren className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {PRICING_PLANS.map((plan, i) => (
            <StaggerItem key={plan.name}>
              <div className={cn(
                "relative p-8 rounded-2xl border transition-all duration-300",
                plan.popular
                  ? "bg-[#111827] border-[#00FF88]/40 shadow-lg shadow-[#00FF88]/5"
                  : "bg-[#111827] border-[#1F2937] hover:border-white/20"
              )}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-[#00FF88] to-[#00D4FF] text-[10px] font-bold text-[#0A0E1A] uppercase tracking-wider">
                    Most Popular
                  </div>
                )}
                <h3 className="text-lg font-bold text-white mb-2">{plan.name}</h3>
                <p className="text-sm text-gray-400 mb-6">{plan.description}</p>
                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-white">{plan.price}</span>
                  </div>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-3 text-sm text-gray-300">
                      <Check className="w-4 h-4 text-[#00FF88] shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.price === null ? "/contact" : "/register"}
                  className={cn(
                    "w-full h-12 flex items-center justify-center rounded-xl text-sm font-bold transition-all",
                    plan.popular
                      ? "bg-gradient-to-r from-[#00FF88] to-[#00D4FF] text-[#0A0E1A] hover:shadow-lg hover:shadow-[#00FF88]/20"
                      : "border border-white/10 text-white hover:bg-white/5"
                  )}
                >
                  {plan.cta}
                </Link>
              </div>
            </StaggerItem>
          ))}
        </StaggerChildren>
      </div>
    </section>
  );
}

/* ─── CTA ─── */
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
                <div className="h-14 w-full sm:w-auto flex items-center justify-center px-10 rounded-2xl bg-white/5 border border-white/10 text-lg font-bold text-gray-500 cursor-not-allowed">
                  <Smartphone className="mr-3 h-6 w-6" />
                  iOS — Coming Soon
                </div>
              </div>
              <p className="mt-6 text-sm text-gray-500">
                APK · v1.0.0 · ~25 MB · Android 8.0+
              </p>
            </div>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}


/* ─── Footer ─── */
function FooterSection() {
  const footerLinks: Record<string, { label: string; href: string }[]> = {
    Product: [
      { label: "Features", href: "/#features" },
      { label: "Atlas", href: "/atlas" },
      { label: "AI Chat", href: "/ai-chat" },
      { label: "Videos", href: "/videos" },
      { label: "Download", href: "/download" },
    ],
    Company: [
      { label: "About", href: "/about" },
      { label: "Founders", href: "/founders" },
      { label: "Community", href: "/community" },
      { label: "Leaderboard", href: "/leaderboard" },
    ],
    Support: [
      { label: "Help Center", href: "/help" },
      { label: "Documentation", href: "/docs" },
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
    ],
  };

  return (
    <footer className="py-16 px-6 border-t border-white/5 bg-[#0A0E1A]">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 mb-12">
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00FF88] to-[#00D4FF] flex items-center justify-center">
                <Brain className="w-4 h-4 text-[#0A0E1A]" />
              </div>
              <span className="text-lg font-bold text-white">MedOneX</span>
            </Link>
            <p className="text-sm text-gray-500 max-w-xs leading-relaxed">
              The AI-powered medical education platform. Empowering 50K+ students across Egypt and the Middle East.
            </p>
          </div>

          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">{category}</h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-sm text-gray-500 hover:text-gray-300 transition-colors">{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">© 2026 MedOneX. All rights reserved.</p>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <Link href="/founders" className="hover:text-gray-300 transition-colors">Made with ❤️ by the MedOneX Team</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ─── Page ─── */
export default function LandingPage() {
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

      {/* Float animation keyframes */}
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
