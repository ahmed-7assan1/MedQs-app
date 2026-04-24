import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { MedQsLogoMark } from "@/components/branding/MedQsLogo";
import {
  ArrowRight, BookOpen, Trophy, MessageSquare, Clock,
  Play, Heart, Mail, Layers, ClipboardList,
  ShieldCheck, Target, GraduationCap, Flame,
  TrendingUp, Zap, Users, CheckCircle2, ChevronRight,
  Brain, Star, BarChart3,
} from "lucide-react";
import { PLATFORM_COPY } from "@/lib/platform-copy";
import { ScrollReveal } from "@/components/landing/ScrollReveal";
import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function LandingPage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  const [userCount, questionCount, moduleCount] = await Promise.all([
    prisma.user.count().catch(() => 0),
    prisma.question.count().catch(() => 0),
    prisma.module.count().catch(() => 0),
  ]);

  return (
    <div className="min-h-screen overflow-hidden text-foreground bg-white dark:bg-[#080c14]">

      {/* ── AMBIENT BACKGROUND ── */}
      {/* Light mode: very subtle grid */}
      <div
        className="fixed inset-0 z-0 pointer-events-none opacity-[0.04] dark:opacity-0"
        style={{
          backgroundImage: "linear-gradient(#1A6BCC 1px, transparent 1px), linear-gradient(90deg, #1A6BCC 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
      {/* Dark mode: deep navy grid */}
      <div
        className="fixed inset-0 z-0 pointer-events-none opacity-0 dark:opacity-[0.06]"
        style={{
          backgroundImage: "linear-gradient(rgba(100,150,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(100,150,255,1) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
      {/* Glow orbs */}
      <div className="fixed -top-[20%] -left-[10%] h-[70%] w-[55%] blur-[150px] pointer-events-none z-0"
        style={{ background: "radial-gradient(circle, rgba(26,107,204,0.12) 0%, transparent 60%)" }} />
      <div className="fixed -bottom-[20%] -right-[10%] h-[65%] w-[55%] blur-[150px] pointer-events-none z-0"
        style={{ background: "radial-gradient(circle, rgba(107,72,204,0.10) 0%, transparent 60%)" }} />

      {/* ── TOP NAV (client component with theme toggle) ── */}
      <LandingNavbar />

      {/* ── HERO ── */}
      <section className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 pb-12 sm:pb-16 pt-16 sm:pt-24 text-center">
        <ScrollReveal>
          {/* Badge */}
          <div className="animate-fade-in mb-6 sm:mb-8 inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold text-blue-500 backdrop-blur-md">
            <ShieldCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            The Ultimate Medical Study Platform
          </div>

          {/* Headline */}
          <h1 className="animate-fade-up mb-4 sm:mb-6 font-display text-[clamp(36px,8vw,80px)] font-extrabold leading-[1.05] tracking-tight text-foreground"
            style={{ animationDelay: ".05s" }}>
            Master Medicine
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-500 bg-clip-text text-transparent">
              With Precision.
            </span>
          </h1>

          <p className="animate-fade-up mx-auto mb-8 sm:mb-10 max-w-2xl text-[clamp(14px,2vw,18px)] leading-relaxed text-muted-foreground px-2"
            style={{ animationDelay: ".1s" }}>
            Structured curriculums, past-paper deep dives, AI-powered study tools,
            and a vibrant community — everything elite med students need in one place.
          </p>

          {/* CTA */}
          <div className="animate-fade-up flex flex-col sm:flex-row flex-wrap justify-center gap-3 sm:gap-4" style={{ animationDelay: ".14s" }}>
            <Link href="/register"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 px-6 py-3.5 sm:px-8 sm:py-4 text-sm sm:text-base font-semibold text-white shadow-[0_12px_40px_-8px_rgba(37,99,235,0.55),inset_0_1px_0_rgba(255,255,255,0.15)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_16px_48px_-8px_rgba(37,99,235,0.65)]">
              Start for Free
              <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
            </Link>
            <Link href="/modules"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/[0.03] bg-background/40 px-6 py-3.5 sm:px-8 sm:py-4 text-sm sm:text-base font-medium text-foreground backdrop-blur-xl transition-colors hover:bg-muted/20">
              <Play className="h-4 w-4 fill-current" />
              Preview Curriculum
            </Link>
            <Link href="/guest/past-papers"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/[0.02] bg-background/20 px-6 py-3.5 sm:px-8 sm:py-4 text-sm sm:text-base font-medium text-muted-foreground backdrop-blur-xl transition-all hover:bg-muted/10 hover:text-foreground">
              Browse as Guest
            </Link>
          </div>

          {/* ── DASHBOARD PREVIEW (mini stat cards) ── */}
          <div className="animate-fade-up mt-16" style={{ animationDelay: ".2s" }}>
            <p className="mb-5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Your Dashboard — at a glance</p>
            <div className="mx-auto grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
              {/* Streak card */}
              <div className="relative overflow-hidden rounded-2xl border border-orange-500/25 bg-card p-4 text-left dark:bg-slate-900/60"
                style={{ background: "linear-gradient(135deg,rgba(249,115,22,.07) 0%,transparent 70%)", borderLeft: "3px solid #f97316" }}>
                <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Streak</p>
                <p className="mt-1 font-display text-3xl font-extrabold tabular-nums text-foreground">12d</p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">Keep going 🔥</p>
                <div className="absolute right-3 top-3 rounded-xl bg-orange-500/10 p-2">
                  <Flame className="h-5 w-5 text-orange-500" />
                </div>
              </div>
              {/* Questions card */}
              <div className="relative overflow-hidden rounded-2xl border border-teal-500/25 bg-card p-4 text-left dark:bg-slate-900/60"
                style={{ background: "linear-gradient(135deg,rgba(6,182,212,.07) 0%,transparent 70%)", borderLeft: "3px solid #06b6d4" }}>
                <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Questions</p>
                <p className="mt-1 font-display text-3xl font-extrabold tabular-nums text-foreground">48</p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">Today&apos;s sessions</p>
                <div className="absolute right-3 top-3 rounded-xl bg-teal-500/10 p-2">
                  <Target className="h-5 w-5 text-teal-500" />
                </div>
              </div>
              {/* Mastery card */}
              <div className="relative overflow-hidden rounded-2xl border border-purple-500/25 bg-card p-4 text-left dark:bg-slate-900/60"
                style={{ background: "linear-gradient(135deg,rgba(139,92,246,.07) 0%,transparent 70%)", borderLeft: "3px solid #8b5cf6" }}>
                <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Mastery</p>
                <p className="mt-1 font-display text-3xl font-extrabold tabular-nums text-foreground">78%</p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">340/435 correct</p>
                <div className="absolute right-3 top-3 rounded-xl bg-purple-500/10 p-2">
                  <TrendingUp className="h-5 w-5 text-purple-500" />
                </div>
              </div>
              {/* Points card */}
              <div className="relative overflow-hidden rounded-2xl border border-amber-500/25 bg-card p-4 text-left dark:bg-slate-900/60"
                style={{ background: "linear-gradient(135deg,rgba(234,179,8,.07) 0%,transparent 70%)", borderLeft: "3px solid #eab308" }}>
                <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Points</p>
                <p className="mt-1 font-display text-3xl font-extrabold tabular-nums text-foreground">2.4k</p>
                <p className="mt-0.5 inline-flex rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-bold text-amber-600 dark:text-amber-400">
                  Gold Rank
                </p>
                <div className="absolute right-3 top-3 rounded-xl bg-amber-500/10 p-2">
                  <Trophy className="h-5 w-5 text-amber-500" />
                </div>
              </div>
            </div>
          </div>

          {/* ── STATS ── */}
          <div className="animate-fade-up mt-14 flex flex-wrap justify-center gap-[clamp(30px,8vw,80px)]"
            style={{ animationDelay: ".26s" }}>
            {[
              { value: userCount.toLocaleString() + "+", label: "Active Students" },
              { value: questionCount.toLocaleString() + "+", label: "Bank Questions" },
              { value: moduleCount.toLocaleString() + "+", label: "Modules Covered" },
            ].map(({ value, label }) => (
              <div key={label} className="text-center">
                <p className="font-display text-[clamp(28px,4vw,40px)] font-extrabold text-foreground">{value}</p>
                <p className="mt-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        </ScrollReveal>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 pb-24 pt-6">
        <ScrollReveal>
          <div className="mb-14 text-center">
            <div className="mb-3 inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-widest text-blue-500">
              <Zap className="h-4 w-4" /> Simple & Powerful
            </div>
            <h2 className="mb-4 font-display text-[clamp(28px,5vw,44px)] font-extrabold tracking-tight text-foreground">
              From Day 1 to Exam Day
            </h2>
            <p className="mx-auto max-w-xl text-base leading-relaxed text-muted-foreground">
              Three simple steps to transform how you study medicine.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {[
              {
                step: "01", icon: BookOpen, color: "#1A6BCC", bg: "rgba(26,107,204,0.08)",
                border: "rgba(26,107,204,0.25)", title: "Browse Your Curriculum",
                desc: "Navigate your exact university structure — module → subject → lecture. Every resource organized for your semester."
              },
              {
                step: "02", icon: Brain, color: "#6B48CC", bg: "rgba(107,72,204,0.08)",
                border: "rgba(107,72,204,0.25)", title: "Practice & Master",
                desc: "Solve past papers, flashcards, and AI-guided quizzes. Spaced repetition keeps concepts in long-term memory."
              },
              {
                step: "03", icon: BarChart3, color: "#059669", bg: "rgba(5,150,105,0.08)",
                border: "rgba(5,150,105,0.25)", title: "Track Your Growth",
                desc: "Watch your mastery score climb. Earn points, level up your rank, and see exactly where to focus next."
              },
            ].map(({ step, icon: Icon, color, bg, border, title, desc }) => (
              <div key={step}
                className="group relative overflow-hidden rounded-2xl border bg-card p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:bg-slate-900/50"
                style={{ borderColor: border, background: `linear-gradient(135deg, ${bg} 0%, transparent 70%)`, borderLeft: `4px solid ${color}` }}>
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl text-white text-sm font-bold shadow-lg"
                    style={{ background: color }}>
                    {step}
                  </div>
                  <div className="rounded-xl p-2.5" style={{ background: bg }}>
                    <Icon className="h-5 w-5" style={{ color }} />
                  </div>
                </div>
                <h3 className="mb-2 font-display text-lg font-bold text-foreground">{title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </ScrollReveal>
      </section>

      {/* ── FEATURES ── */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 pb-24">
        <ScrollReveal>
          <div className="mb-14 text-center">
            <div className="mb-3 inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-widest text-purple-500">
              <Star className="h-4 w-4" /> Everything You Need
            </div>
            <h2 className="mb-4 font-display text-[clamp(28px,5vw,44px)] font-extrabold tracking-tight text-foreground">
              Built for Med School Rigor
            </h2>
            <p className="mx-auto max-w-xl text-base text-muted-foreground">
              Every tool engineered for efficiency — so you study smarter, not harder.
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal delayMs={100}>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {([
              { icon: BookOpen, color: "#1A6BCC", bg: "rgba(26,107,204,.08)", border: "rgba(26,107,204,.25)", title: "Structured Curriculum", desc: "University → Semester → Module → Lecture. Perfectly mapped to your exact academic year.", tag: "Core" },
              { icon: Layers, color: "#6B48CC", bg: "rgba(107,72,204,.08)", border: "rgba(107,72,204,.25)", title: "Active Recall Cards", desc: "Turn any concept into smart flashcards. Spaced repetition ensures nothing is forgotten.", tag: "Memory" },
              { icon: ClipboardList, color: "#e11d48", bg: "rgba(225,29,72,.08)", border: "rgba(225,29,72,.25)", title: "Exam Simulator", desc: "Timed past papers with detailed rationales for every option — exactly like the real thing.", tag: "Exams" },
              { icon: MessageSquare, color: "#059669", bg: "rgba(5,150,105,.08)", border: "rgba(5,150,105,.25)", title: "Community Forums", desc: "Global & semester-specific groups. Ask, discuss, and collaborate with your exact cohort.", tag: "Social" },
              { icon: Trophy, color: "#d97706", bg: "rgba(217,119,6,.08)", border: "rgba(217,119,6,.25)", title: "Gamified Progress", desc: "Earn XP, climb the leaderboard, and unlock rank badges as you master subjects.", tag: "Motivation" },
              { icon: Clock, color: "#0ea5e9", bg: "rgba(14,165,233,.08)", border: "rgba(14,165,233,.25)", title: "Study Workspace", desc: "Pomodoro timer, task list, and a digital canvas for diagrams — all in one focus room.", tag: "Focus" },
            ] as const).map(({ icon: Icon, color, bg, border, title, desc, tag }) => (
              <div key={title}
                className="group relative overflow-hidden rounded-2xl border bg-card p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:bg-slate-900/50"
                style={{ borderColor: border, borderLeft: `4px solid ${color}`, background: `linear-gradient(135deg, ${bg} 0%, transparent 70%)` }}>
                <div className="mb-1 flex items-center justify-between">
                  <div className="rounded-xl p-2.5" style={{ background: bg }}>
                    <Icon className="h-5 w-5" style={{ color }} />
                  </div>
                  <span className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                    style={{ background: bg, color }}>
                    {tag}
                  </span>
                </div>
                <h3 className="mb-2 mt-4 font-display text-lg font-bold text-foreground">{title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </ScrollReveal>
      </section>

      {/* ── AI SECTION ── */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 pb-24">
        <ScrollReveal>
          <div className="relative overflow-hidden rounded-3xl border border-blue-500/20 p-[clamp(32px,6vw,60px)]"
            style={{ background: "linear-gradient(135deg, rgba(26,107,204,0.08) 0%, rgba(107,72,204,0.06) 100%)" }}>
            <div className="pointer-events-none absolute right-0 top-0 h-full w-1/2 opacity-50"
              style={{ background: "radial-gradient(ellipse at right, rgba(107,72,204,0.15), transparent 70%)" }} />

            <div className="relative z-10 flex flex-wrap items-center gap-12">
              <div className="flex-1 min-w-[280px]">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-purple-500/25 bg-purple-500/10 px-4 py-1.5 text-sm font-semibold text-purple-500">
                  <Brain className="h-4 w-4" />
                  AI-Powered
                </div>
                <h2 className="mb-4 font-display text-[clamp(26px,4vw,38px)] font-extrabold leading-tight text-foreground">
                  Your AI Study<br />Companion
                </h2>
                <p className="mb-6 text-base leading-relaxed text-muted-foreground">
                  Get instant explanations, generate study notes from your lectures, create custom quizzes on any topic, and ask clinical questions — all powered by Gemini AI.
                </p>
                <ul className="space-y-2">
                  {["AI-generated structured study notes", "Custom quiz generation from lecture content", "Clinical case discussions with rationale", "Instant concept explanations"].map(item => (
                    <li key={item} className="flex items-center gap-2.5 text-sm text-foreground/80">
                      <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-green-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex-shrink-0">
                <div className="w-72 overflow-hidden rounded-2xl border border-white/[0.02] bg-card/80 p-5 shadow-2xl backdrop-blur-xl dark:bg-slate-900/80">
                  <div className="mb-3 flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    <span className="text-xs font-medium text-muted-foreground">Dr. Q — AI Assistant</span>
                  </div>
                  <div className="space-y-3">
                    <div className="rounded-xl rounded-tl-sm bg-muted/60 px-3 py-2.5 text-xs text-foreground">
                      Explain the renin-angiotensin system in simple terms
                    </div>
                    <div className="rounded-xl rounded-tr-sm px-3 py-2.5 text-xs text-foreground"
                      style={{ background: "linear-gradient(135deg, rgba(26,107,204,0.12), rgba(107,72,204,0.12))", border: "1px solid rgba(107,72,204,0.2)" }}>
                      The RAS is a hormone system that regulates blood pressure and fluid balance. It begins with renin released from juxtaglomerular cells when BP drops...
                    </div>
                    <div className="mt-2 flex gap-1.5">
                      {["📝 Take notes", "🎯 Quiz me", "🔎 Deeper"].map(t => (
                        <span key={t} className="rounded-full border border-white/[0.02] bg-muted/40 px-2.5 py-1 text-[10px] font-medium text-muted-foreground">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* ── SOCIAL PROOF ── */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 pb-24">
        <ScrollReveal>
          <div className="mb-12 text-center">
            <div className="mb-3 inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-widest text-amber-500">
              <Users className="h-4 w-4" /> Trusted By Students
            </div>
            <h2 className="font-display text-[clamp(26px,4vw,40px)] font-extrabold tracking-tight text-foreground">
              What Students Are Saying
            </h2>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {[
              { text: "MedOneX completely changed how I prepare for exams. The structured curriculum and past papers are next level.", name: "Sara M.", role: "3rd Year Medical Student", stars: 5, color: "#1A6BCC" },
              { text: "The AI assistant explains everything so clearly. I use it every day before my clinical sessions.", name: "Ahmed K.", role: "Clinical Year, Cairo University", stars: 5, color: "#6B48CC" },
              { text: "Finally a platform built specifically for medical students, not generic Q&A. The leaderboard keeps me motivated!", name: "Fatima H.", role: "2nd Year, Alexandria University", stars: 5, color: "#059669" },
            ].map(({ text, name, role, stars, color }) => (
              <div key={name}
                className="relative rounded-2xl border border-white/[0.02] bg-card p-6 dark:bg-slate-900/50"
                style={{ borderLeft: `3px solid ${color}` }}>
                <div className="mb-4 flex gap-0.5">
                  {Array(stars).fill(0).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="mb-5 text-sm leading-relaxed text-foreground/80">&quot;{text}&quot;</p>
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white"
                    style={{ background: color }}>
                    {name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{name}</p>
                    <p className="text-xs text-muted-foreground">{role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollReveal>
      </section>

      {/* ── FACULTY SECTION ── */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 pb-24">
        <ScrollReveal>
          <div className="relative overflow-hidden rounded-3xl border border-white/[0.05] bg-card/50 p-[clamp(30px,5vw,56px)] dark:bg-slate-900/50">
            <div className="pointer-events-none absolute right-0 top-0 h-full w-1/2"
              style={{ background: "radial-gradient(ellipse at right, rgba(26,107,204,0.08), transparent 70%)" }} />

            <div className="relative z-10 flex flex-wrap items-center justify-between gap-10">
              <div className="flex-[1_1_420px]">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-500/25 bg-blue-500/10 px-4 py-1.5 text-sm font-semibold text-blue-500">
                  <GraduationCap className="h-4 w-4" />
                  {PLATFORM_COPY.landingForDoctorsEyebrow}
                </div>
                <h2 className="mb-4 font-display text-[clamp(26px,4vw,38px)] font-extrabold leading-tight text-foreground">
                  {PLATFORM_COPY.landingForDoctorsTitle}
                </h2>
                <p className="mb-5 text-base leading-relaxed text-muted-foreground">
                  {PLATFORM_COPY.landingForDoctorsBody}
                </p>
                <p dir="rtl" className="rounded-xl border border-white/[0.05] bg-black/5 p-4 text-sm leading-relaxed text-muted-foreground dark:bg-black/20">
                  {PLATFORM_COPY.landingForDoctorsArabic}
                </p>
              </div>

              <div className="flex-none">
                <div className="rounded-2xl border border-white/[0.02] bg-background/60 p-8 backdrop-blur-xl shadow-xl dark:bg-white/5">
                  <Link href="/login"
                    className="flex items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-4 text-base font-semibold text-white shadow-[0_8px_28px_rgba(37,99,235,0.35)] transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(37,99,235,0.45)]">
                    Staff Login
                    <ChevronRight className="h-5 w-5" />
                  </Link>
                  <p className="mt-4 text-center text-xs leading-relaxed text-muted-foreground">
                    Direct access via{" "}
                    <Link href="/doctor" className="font-medium text-blue-500 hover:text-blue-400">/doctor</Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="relative z-10 mx-auto max-w-4xl px-6 pb-28 text-center">
        <ScrollReveal>
          <div className="relative overflow-hidden rounded-3xl border border-blue-500/25 p-[clamp(40px,6vw,72px)]"
            style={{ background: "linear-gradient(135deg, rgba(26,107,204,0.1) 0%, rgba(107,72,204,0.08) 100%)" }}>
            <div className="pointer-events-none absolute inset-0"
              style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(26,107,204,0.15) 0%, transparent 60%)" }} />
            <div className="relative z-10">
              <h2 className="mb-5 font-display text-[clamp(28px,5vw,48px)] font-extrabold tracking-tight text-foreground">
                Ready to Excel?
              </h2>
              <p className="mx-auto mb-8 max-w-md text-base leading-relaxed text-muted-foreground">
                Join thousands of medical students who are studying smarter and achieving better results with MedOneX.
              </p>
              <Link href="/register"
                className="inline-flex items-center gap-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-10 py-4 text-base font-bold text-white shadow-[0_14px_48px_-8px_rgba(37,99,235,0.6)] transition-all hover:-translate-y-1 hover:shadow-[0_18px_56px_-8px_rgba(37,99,235,0.7)]">
                Create Free Account
                <ArrowRight className="h-5 w-5" />
              </Link>
              <p className="mt-4 text-xs text-muted-foreground">No credit card required · Free forever for students</p>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* ── FOOTER ── */}
      <footer className="relative z-10 border-t border-white/[0.05] bg-card/20 pb-10 pt-14">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-12 grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <Link href="/" className="mb-5 flex items-center gap-3 decoration-transparent">
                <MedQsLogoMark className="h-8 w-8 shrink-0" title="MedOneX" />
              </Link>
              <p className="max-w-[300px] text-sm leading-relaxed text-muted-foreground">
                Elevating medical education with precision tools, structured curriculums, and an unstoppable community.
              </p>
            </div>

            <div>
              <p className="mb-4 text-xs font-bold uppercase tracking-[0.1em] text-foreground">Platform</p>
              {[["Curriculum", "/modules"], ["Flashcards", "/study-tools"], ["Leaderboard", "/leaderboard"], ["Study Space", "/space"], ["Forums", "/forum"]].map(([l, h]) => (
                <Link key={l} href={h} className="mb-2.5 block text-sm text-muted-foreground decoration-transparent transition-colors hover:text-blue-500">{l}</Link>
              ))}
            </div>

            <div>
              <p className="mb-4 text-xs font-bold uppercase tracking-[0.1em] text-foreground">Account</p>
              {[["Sign In", "/login"], ["Create Account", "/register"], ["Faculty Portal", "/doctor"], ["Guest Access", "/modules"]].map(([l, h]) => (
                <Link key={l} href={h} className="mb-2.5 block text-sm text-muted-foreground decoration-transparent transition-colors hover:text-blue-500">{l}</Link>
              ))}
            </div>

            <div>
              <p className="mb-4 text-xs font-bold uppercase tracking-[0.1em] text-foreground">Connect</p>
              <a href="mailto:support@medqs.app" className="mb-2.5 flex items-center gap-2.5 text-sm text-muted-foreground decoration-transparent transition-colors hover:text-blue-500">
                <Mail className="h-4 w-4" /> Contact Support
              </a>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/[0.02] pt-7">
            <p className="text-xs text-muted-foreground">© 2026 MedOneX. Excellence in medical education.</p>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              Crafted with <Heart className="h-3.5 w-3.5 animate-pulse text-rose-500" /> for future healthcare leaders
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}


