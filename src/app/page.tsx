import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { MedQsLogoMark, MedQsWordmark } from "@/components/branding/MedQsLogo";
import { 
  ArrowRight, BookOpen, Trophy, MessageSquare, Clock, 
  Play, Heart, Mail, Github, Layers, ClipboardList, Library, 
  Stethoscope, ShieldCheck, Target, GraduationCap 
} from "lucide-react";
import { PLATFORM_COPY } from "@/lib/platform-copy";
import { ScrollReveal } from "@/components/landing/ScrollReveal";
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
    <div className="min-h-screen bg-background overflow-hidden text-foreground">
      
      {/* ── AMBIENT MESH GRID & GRADIENTS ── */}
      <div 
        className="fixed inset-0 z-0 pointer-events-none opacity-[0.03] dark:opacity-80"
        style={{ 
          backgroundImage: "linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          backgroundPosition: "center center",
        }} 
      />
      
      <div 
        className="fixed -top-[15%] -left-[10%] h-[70%] w-[50%] blur-[120px] pointer-events-none z-0"
        style={{ background: "radial-gradient(circle, hsl(var(--primary)/0.15) 0%, transparent 60%)" }} 
      />
      <div 
        className="fixed -bottom-[20%] -right-[10%] h-[60%] w-[60%] blur-[120px] pointer-events-none z-0"
        style={{ background: "radial-gradient(circle, hsl(var(--primary)/0.12) 0%, transparent 60%)" }} 
      />

      {/* ── TOP NAV ── */}
      <nav className="sticky top-0 z-50 border-b border-border/40 bg-background/70 backdrop-blur-2xl">
        <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between px-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 decoration-transparent">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-primary/40 blur-[12px]"></div>
              <MedQsLogoMark className="relative z-10 h-9 w-9 shrink-0" title="MedQs" />
            </div>
            <MedQsWordmark className="text-xl font-bold tracking-tight text-foreground" />
          </Link>

          {/* Links */}
          <div className="flex items-center gap-2">
            <Link href="/login" className="rounded-xl px-5 py-2.5 text-sm font-medium text-foreground/80 transition-colors duration-200 hover:bg-muted/50 hover:text-foreground">
              Sign In
            </Link>
            <Link href="/register" className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-primary to-primary/80 px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-[0_8px_30px_hsl(var(--primary)/0.3)] transition-transform duration-300 hover:scale-[1.02] active:scale-[0.98]">
              Get Started Free
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative z-10 mx-auto max-w-5xl px-6 pb-20 pt-32 text-center">
        <ScrollReveal>
          {/* Badge */}
          <div className="animate-fade-in mb-9 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary backdrop-blur-md shadow-[inset_0_0_20px_hsl(var(--primary)/0.1)]">
            <ShieldCheck className="h-4 w-4" />
            The Ultimate Medical Study Platform
          </div>

          {/* Headline */}
          <h1 
            className="animate-fade-up mb-6 font-display text-[clamp(48px,8vw,84px)] font-extrabold leading-[1.05] tracking-tight text-foreground"
            style={{ animationDelay: ".05s" }}
          >
            Master Medicine<br />
            <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent drop-shadow-[0_10px_30px_rgba(96,165,250,0.2)]">
              With Precision.
            </span>
          </h1>

          <p 
            className="animate-fade-up mx-auto mb-12 max-w-2xl text-[clamp(16px,2vw,20px)] leading-relaxed tracking-wide text-muted-foreground"
            style={{ animationDelay: ".1s" }}
          >
            Access perfectly structured curriculums, dive into detailed past-paper explanations, map your progress, and join a vibrant community of elite future doctors.
          </p>

          {/* CTA */}
          <div 
            className="animate-fade-up flex flex-wrap justify-center gap-4"
            style={{ animationDelay: ".14s" }}
          >
            <Link href="/register" className="inline-flex items-center gap-2.5 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 px-8 py-4 text-base font-semibold text-white shadow-[0_10px_40px_-10px_rgba(37,99,235,0.6),inset_0_1px_0_rgba(255,255,255,0.2)] transition-transform duration-200 hover:-translate-y-1">
              Join Now
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link href="/modules" className="inline-flex items-center gap-2.5 rounded-2xl border border-border/80 bg-background/5 px-8 py-4 text-base font-medium text-foreground backdrop-blur-xl transition-colors duration-200 hover:bg-muted/10">
              <Play className="h-5 w-5 fill-current" />
              Preview Curriculum
            </Link>
          </div>

          {/* Stats */}
          <div 
            className="animate-fade-up mt-16 flex flex-wrap justify-center gap-[clamp(30px,8vw,80px)]"
            style={{ animationDelay: ".2s" }}
          >
            {[
              { value: userCount.toLocaleString() + "+", label: "Active Students" },
              { value: questionCount.toLocaleString() + "+", label: "Bank Questions" },
              { value: moduleCount.toLocaleString() + "+", label: "Modules Covered" },
            ].map(({ value, label }) => (
              <div key={label} className="text-center">
                <p className="m-0 font-display text-[clamp(32px,4vw,42px)] font-extrabold text-foreground drop-shadow-md">{value}</p>
                <p className="mt-1.5 text-sm font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        </ScrollReveal>
      </section>

      {/* ── FEATURES ── */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 pb-24 pt-10">
        <ScrollReveal>
          <div className="mb-16 text-center">
            <div className="mb-4 inline-flex items-center gap-2 text-[13px] font-semibold uppercase tracking-widest text-primary">
              <Target className="h-4 w-4" />
              Elite Toolset
            </div>
            <h2 className="mb-4 font-display text-[clamp(32px,5vw,48px)] font-extrabold tracking-tight text-foreground">
              Built for the Rigors of Med School
            </h2>
            <p className="mx-auto max-w-2xl text-lg leading-relaxed text-muted-foreground">
              Everything you need to master complex subjects and conquer your exams faster than ever.
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal delayMs={100} className="block">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: BookOpen, iconClass: "text-blue-500", shadowKey: "shadow-blue-500/20", gradient: "from-blue-400 to-blue-600", title: "Structured Curriculum", desc: "University → Year → Semester → Module → Subject → Lecture. Never get lost." },
              { icon: Layers, iconClass: "text-indigo-500", shadowKey: "shadow-indigo-500/20", gradient: "from-indigo-400 to-indigo-600", title: "Active Recall", desc: "Turn any concept into actionable flashcards to build long-term retention seamlessly." },
              { icon: ClipboardList, iconClass: "text-pink-500", shadowKey: "shadow-pink-500/20", gradient: "from-pink-400 to-pink-600", title: "Exam Simulator", desc: "Solve fully-timed past papers with detailed rationales for every single option." },
              { icon: MessageSquare, iconClass: "text-emerald-500", shadowKey: "shadow-emerald-500/20", gradient: "from-emerald-400 to-emerald-600", title: "Collaborative Forums", desc: "Global, semester-specific, and private discussion groups specifically for your cohort." },
              { icon: Trophy, iconClass: "text-amber-500", shadowKey: "shadow-amber-500/20", gradient: "from-amber-400 to-amber-600", title: "Gamified Leaderboards", desc: "Earn experience points, acquire mastery badges, and climb the ranks among your peers." },
              { icon: Clock, iconClass: "text-sky-500", shadowKey: "shadow-sky-500/20", gradient: "from-sky-400 to-sky-600", title: "Deep Study Workspace", desc: "Integrated Pomodoro timer, dynamic task list, and a canvas to sketch pathways while studying." },
            ].map(({ icon: Icon, iconClass, shadowKey, gradient, title, desc }) => (
              <div 
                key={title} 
                className="group relative overflow-hidden rounded-2xl border border-border/80 bg-card/60 backdrop-blur-xl transition-all duration-400 ease-in-out hover:-translate-y-1 hover:border-primary/30 hover:shadow-2xl dark:bg-background/20"
              >
                {/* Hover Glow */}
                <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 transition-opacity duration-500 group-hover:opacity-10`} />
                <div className="relative p-8">
                  <div className={`mb-5 inline-flex rounded-2xl border border-border bg-card/80 p-3.5 shadow-lg ${shadowKey} transition-transform duration-300 ease-in-out group-hover:scale-110`}>
                    <Icon className={`h-6 w-6 ${iconClass}`} />
                  </div>
                  <h3 className="mb-2.5 font-display text-xl font-bold text-foreground">{title}</h3>
                  <p className="text-[15px] leading-relaxed text-muted-foreground">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </ScrollReveal>
      </section>

      {/* ── DOCTORS & FACULTY ── */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 pb-24">
        <ScrollReveal>
          <div className="relative overflow-hidden rounded-[2rem] border border-primary/20 bg-gradient-to-br from-primary/5 to-background/40 p-[clamp(30px,6vw,60px)] shadow-[0_40px_80px_-20px_rgba(37,99,235,0.2)]">
            <div className="pointer-events-none absolute right-0 top-0 h-full w-1/2 bg-[radial-gradient(ellipse_at_right,_hsl(var(--primary)/0.1),_transparent_70%)]" />
            
            <div className="relative z-10 flex flex-wrap items-center justify-between gap-10">
              <div className="flex-[1_1_500px]">
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-[13px] font-semibold text-primary">
                  <GraduationCap className="h-4 w-4" aria-hidden />
                  {PLATFORM_COPY.landingForDoctorsEyebrow}
                </div>
                <h2 className="mb-4 font-display text-[clamp(28px,4vw,40px)] font-extrabold leading-[1.15] tracking-tight text-foreground">
                  {PLATFORM_COPY.landingForDoctorsTitle}
                </h2>
                <p className="mb-5 text-[17px] leading-relaxed text-muted-foreground">
                  {PLATFORM_COPY.landingForDoctorsBody}
                </p>
                <p dir="rtl" className="m-0 rounded-xl border border-border/50 bg-black/5 p-4 text-base leading-relaxed text-muted-foreground dark:bg-black/20">
                  {PLATFORM_COPY.landingForDoctorsArabic}
                </p>
              </div>
              <div className="flex-none">
                <div className="rounded-3xl border border-border/80 bg-background/50 p-8 backdrop-blur-xl transition-shadow hover:shadow-xl dark:bg-white/5">
                  <Link href="/login" className="flex items-center justify-center gap-2.5 rounded-2xl bg-foreground px-8 py-4 text-base font-semibold text-background shadow-[0_10px_30px_rgba(0,0,0,0.15)] transition-transform duration-200 hover:-translate-y-1 dark:shadow-[0_10px_30px_rgba(255,255,255,0.15)]">
                    Staff Login
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                  <p className="mt-4 text-center text-[13px] leading-relaxed text-muted-foreground">
                    Direct access via{" "}
                    <Link href="/doctor" className="font-medium text-primary transition-colors hover:text-primary/80">/doctor</Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* ── FOOTER ── */}
      <footer className="relative z-10 border-t border-border/40 bg-card/30 pb-10 pt-16">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-16 grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <Link href="/" className="mb-5 flex items-center gap-3 decoration-transparent">
                <MedQsLogoMark className="h-8 w-8 shrink-0" title="MedQs" />
                <MedQsWordmark className="text-xl font-bold text-foreground" />
              </Link>
              <p className="max-w-[320px] text-[15px] leading-relaxed text-muted-foreground">
                Elevating medical education with precision tools, structured curriculums, and an unstoppable community.
              </p>
            </div>
            
            <div>
              <p className="mb-5 text-xs font-bold uppercase tracking-[0.1em] text-foreground">Features</p>
              {[["Curriculum", "/modules"], ["Flashcards", "/study-tools"], ["Leaderboard", "/leaderboard"], ["Study Space", "/space"], ["Discussions", "/forum"]].map(([l, h]) => (
                <Link key={l} href={h} className="mb-3 block text-sm text-muted-foreground decoration-transparent transition-colors duration-200 hover:text-primary">
                  {l}
                </Link>
              ))}
            </div>

            <div>
              <p className="mb-5 text-xs font-bold uppercase tracking-[0.1em] text-foreground">Account</p>
              {[["Sign In", "/login"], ["Create Account", "/register"], ["Faculty Portal", "/doctor"], ["Guest Access", "/modules"]].map(([l, h]) => (
                <Link key={l} href={h} className="mb-3 block text-sm text-muted-foreground decoration-transparent transition-colors duration-200 hover:text-primary">
                  {l}
                </Link>
              ))}
            </div>

            <div>
              <p className="mb-5 text-xs font-bold uppercase tracking-[0.1em] text-foreground">Connect</p>
              <a href="mailto:support@medqs.app" className="mb-3 flex items-center gap-2.5 text-sm text-muted-foreground decoration-transparent transition-colors duration-200 hover:text-primary">
                <Mail className="h-4 w-4" /> Contact Support
              </a>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 text-sm text-muted-foreground decoration-transparent transition-colors duration-200 hover:text-primary">
                <Github className="h-4 w-4" /> GitHub Source
              </a>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border/40 pt-8">
            <p className="m-0 text-sm text-muted-foreground">© 2026 MedQs. Excellence in medical education.</p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              Crafted with
              <Heart className="h-3.5 w-3.5 animate-pulse text-rose-500" />
              for future healthcare leaders
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
