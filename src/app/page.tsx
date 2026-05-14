import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { 
  ArrowRight, Play, CheckCircle2, 
  BookOpen, Brain, Layers, 
  ClipboardList, MessageSquare, 
  Trophy, Clock, Target, Star
} from "lucide-react";
import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { CinematicBackground } from "@/components/landing/CinematicBackground";
import { WordFadeUp } from "@/components/landing/WordFadeUp";
import { StatsCounter } from "@/components/landing/StatsCounter";
import { ScrollReveal } from "@/components/landing/ScrollReveal";
import { MedOneXLogoMark } from "@/components/branding/MedQsLogo";

export default async function LandingPage() {
  // Use Supabase (not legacy NextAuth) for session check
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    // Check if profile is complete in DB
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { universityId: true }
    }).catch(() => null);
    if (!dbUser?.universityId) redirect("/auth?mode=onboarding");
    redirect("/dashboard");
  }

  const [userCount, questionCount, moduleCount] = await Promise.all([
    prisma.user.count().catch(() => 0),
    prisma.question.count().catch(() => 0),
    prisma.module.count().catch(() => 0),
  ]);

  return (
    <div className="relative min-h-screen selection:bg-primary/30 selection:text-white transition-colors duration-500">
      <CinematicBackground />
      <LandingNavbar />

      {/* ── HERO SECTION ── */}
      <section className="relative pt-32 pb-20 sm:pt-48 sm:pb-32 px-6 overflow-hidden">
        <div className="mx-auto max-w-7xl text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-200/50 dark:bg-white/5 border border-slate-300 dark:border-white/10 text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest animate-fade-in mb-8 shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            Trusted by {userCount.toLocaleString()}+ Medical Students
          </div>

          <WordFadeUp 
            text="Master Medicine. Faster. Smarter."
            className="text-[clamp(40px,8vw,96px)] font-black leading-[0.95] tracking-tighter text-slate-900 dark:text-white mb-8"
          />

          <p className="mx-auto max-w-2xl text-lg sm:text-xl text-slate-600 dark:text-white/60 leading-relaxed mb-12 animate-fade-up">
            The AI-powered platform built for medical students — with curated lectures, 
            adaptive MCQs, spaced repetition, and your personal AI doctor assistant.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-up">
            <Link
              href="/register"
              className="group h-14 w-full sm:w-auto flex items-center justify-center px-10 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-lg font-bold text-white shadow-2xl shadow-blue-500/40 hover:scale-105 transition-all"
            >
              Get Started Free
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/modules"
              className="h-14 w-full sm:w-auto flex items-center justify-center px-10 rounded-2xl bg-slate-200/50 dark:bg-white/5 border border-slate-300 dark:border-white/10 text-lg font-bold text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-white/10 transition-all"
            >
              <Play className="mr-2 h-5 w-5 fill-current" />
              Watch Demo
            </Link>
          </div>

          {/* Hero Visual Mockup */}
          <div className="mt-20 relative mx-auto max-w-5xl group">
             <div className="absolute inset-0 bg-blue-500/10 dark:bg-blue-500/20 blur-[100px] -z-10 group-hover:bg-blue-500/30 transition-colors" />
             <div className="rounded-[32px] border border-slate-200 dark:border-white/10 p-2 bg-white/40 dark:bg-white/5 backdrop-blur-3xl shadow-2xl animate-float">
                <div className="aspect-video rounded-[24px] overflow-hidden bg-slate-100 dark:bg-slate-900 flex items-center justify-center relative">
                   <img 
                      src="https://images.unsplash.com/photo-1576091160550-2173bdb999ef?q=80&w=2000" 
                      className="w-full h-full object-cover opacity-50 grayscale hover:grayscale-0 transition-all duration-1000" 
                      alt="Dashboard Preview"
                   />
                   <div className="absolute inset-0 bg-gradient-to-t from-slate-50 dark:from-[#05070f] via-transparent to-transparent" />
                   <div className="absolute inset-0 flex items-center justify-center">
                      <div className="p-8 rounded-full bg-white/40 dark:bg-white/10 border border-slate-200 dark:border-white/20 backdrop-blur-xl shadow-lg">
                         <MedOneXLogoMark className="h-16 w-16 text-slate-900 dark:text-white" />
                      </div>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* ── SOCIAL PROOF BAR ── */}
      <section className="py-10 border-y border-slate-200 dark:border-white/5 bg-slate-100/50 dark:bg-white/[0.02]">
        <div className="mx-auto max-w-7xl px-6 overflow-hidden text-center">
          <p className="text-xs font-bold text-slate-400 dark:text-white/30 uppercase tracking-[0.3em] mb-8">Used by students from</p>
          <div className="flex space-x-12 animate-marquee whitespace-nowrap">
            {["Cairo University", "Ain Shams", "Alexandria University", "Mansoura", "Tanta", "Assiut", "Zagazig"].map((uni) => (
              <span key={uni} className="text-xl font-bold text-slate-300 dark:text-white/20 hover:text-slate-600 dark:hover:text-white/60 transition-colors cursor-default">{uni}</span>
            ))}
            {["Cairo University", "Ain Shams", "Alexandria University", "Mansoura", "Tanta", "Assiut", "Zagazig"].map((uni) => (
              <span key={uni+"-2"} className="text-xl font-bold text-slate-300 dark:text-white/20 hover:text-slate-600 dark:hover:text-white/60 transition-colors cursor-default">{uni}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES SECTION ── */}
      <section id="features" className="py-32 px-6">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-20">
            <h2 className="text-4xl sm:text-6xl font-black tracking-tight text-slate-900 dark:text-white mb-6">Built for Med School Rigor</h2>
            <p className="text-lg text-slate-500 dark:text-white/50 max-w-xl mx-auto">Every tool engineered for efficiency — so you study smarter, not harder.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { 
                icon: BookOpen, title: "Curated Library", tag: "Core",
                desc: "Organized lectures by subject, year, and university structure. No more hunting for files.",
                color: "text-blue-600 dark:text-blue-400"
              },
              { 
                icon: Brain, title: "Adaptive MCQ", tag: "Exams",
                desc: "Smart past papers that analyze your performance and highlight weak areas automatically.",
                color: "text-purple-600 dark:text-purple-400"
              },
              { 
                icon: Layers, title: "Spaced Repetition", tag: "Memory",
                desc: "Built-in flashcard system with an algorithm designed for long-term clinical retention.",
                color: "text-emerald-600 dark:text-emerald-400"
              },
              { 
                icon: Target, title: "Ask Dr.Q (AI)", tag: "Assistant",
                desc: "Your personal AI medical assistant, ready to explain complex concepts 24/7.",
                color: "text-cyan-600 dark:text-cyan-400"
              },
              { 
                icon: Clock, title: "Study Scheduler", tag: "Planning",
                desc: "Build your personalized study plan and track your mastery progress day by day.",
                color: "text-orange-600 dark:text-orange-400"
              },
              { 
                icon: MessageSquare, title: "Medical Community", tag: "Social",
                desc: "Connect with doctors and fellow students in high-quality, verified forums.",
                color: "text-rose-600 dark:text-rose-400"
              }
            ].map((feature, i) => (
              <div 
                key={i}
                className="group p-8 rounded-3xl bg-slate-100/50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 hover:border-primary/50 hover:bg-white transition-all duration-500 shadow-sm hover:shadow-xl"
              >
                <div className={`w-12 h-12 rounded-2xl bg-white dark:bg-white/5 flex items-center justify-center mb-6 shadow-sm ${feature.color}`}>
                  <feature.icon size={24} />
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">{feature.title}</h3>
                  <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-white/5 text-[10px] font-bold text-slate-500 dark:text-white/40 uppercase tracking-widest">{feature.tag}</span>
                </div>
                <p className="text-slate-500 dark:text-white/50 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS SECTION ── */}
      <section id="stats" className="py-20 px-6">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-slate-900 dark:text-white">
            <StatsCounter value={userCount} suffix="+" label="Active Students" />
            <StatsCounter value={questionCount} suffix="+" label="Bank Questions" />
            <StatsCounter value={moduleCount} label="Modules Covered" />
            <StatsCounter value={95} suffix="%" label="Exam Pass Rate" />
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="py-32 px-6 overflow-hidden">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col lg:flex-row items-center gap-20">
            <div className="lg:w-1/2">
              <h2 className="text-4xl sm:text-6xl font-black tracking-tight text-slate-900 dark:text-white mb-8">From Day 1 to Exam Day</h2>
              <div className="space-y-12">
                {[
                  { step: "01", title: "Setup Profile", desc: "Select your university, faculty, and academic year to get a personalized view." },
                  { step: "02", title: "Practice MCQs", desc: "Dive into our massive bank of previous exam questions with detailed rationales." },
                  { step: "03", title: "Excel & Grow", desc: "Watch your mastery score climb and track your progress against your peers." }
                ].map((item) => (
                  <div key={item.step} className="flex gap-6">
                    <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-primary/10 dark:bg-primary/20 border border-primary/30 dark:border-primary/40 flex items-center justify-center text-primary font-black shadow-sm">
                      {item.step}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{item.title}</h3>
                      <p className="text-slate-500 dark:text-white/50 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="lg:w-1/2 relative">
               <div className="absolute inset-0 bg-indigo-500/10 dark:bg-indigo-500/20 blur-[120px] -z-10" />
               <div className="p-8 rounded-[40px] bg-white/40 dark:bg-white/5 border border-slate-200 dark:border-white/10 backdrop-blur-2xl shadow-xl">
                  <div className="aspect-square rounded-[32px] bg-white dark:bg-slate-900/50 flex flex-col p-8 overflow-hidden shadow-inner">
                     <div className="h-2 w-24 bg-slate-200 dark:bg-white/10 rounded-full mb-8" />
                     <div className="space-y-4">
                        {[1,2,3].map(i => (
                          <div key={i} className="h-16 w-full rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5 animate-pulse" />
                        ))}
                     </div>
                     <div className="mt-auto flex justify-between items-end">
                        <div className="h-20 w-20 rounded-3xl bg-blue-500/20" />
                        <div className="h-32 w-20 rounded-3xl bg-indigo-500/40" />
                        <div className="h-44 w-20 rounded-3xl bg-primary shadow-lg" />
                     </div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-32 px-6">
        <div className="mx-auto max-w-7xl text-center">
          <h2 className="text-4xl font-black text-slate-900 dark:text-white mb-4">Trusted by the Future Leaders</h2>
          <p className="text-slate-400 dark:text-white/40 uppercase tracking-widest text-xs font-bold mb-20">Feedback from our community</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { name: "Sara M.", uni: "Cairo University", quote: "MedOneX completely changed how I prepare for exams. The structured curriculum is next level." },
              { name: "Ahmed K.", uni: "Ain Shams", quote: "The AI assistant explains everything so clearly. I use it every day for clinical rounds." },
              { name: "Laila H.", uni: "Alexandria", quote: "Finally a platform built specifically for us. The MCQ engine is a lifesaver." }
            ].map((t, i) => (
              <div key={i} className="p-8 rounded-3xl bg-slate-100/50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 relative group text-left shadow-sm hover:shadow-xl transition-all">
                <Star className="absolute top-8 right-8 text-yellow-500/10 group-hover:text-yellow-500 transition-colors" size={24} fill="currentColor" />
                <p className="text-lg text-slate-700 dark:text-white/80 leading-relaxed mb-8 italic">"{t.quote}"</p>
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-white text-lg shadow-lg">
                      {t.name[0]}
                   </div>
                   <div>
                      <p className="font-bold text-slate-900 dark:text-white">{t.name}</p>
                      <p className="text-xs text-slate-400 dark:text-white/40 uppercase tracking-widest">{t.uni}</p>
                   </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA SECTION ── */}
      <section className="py-32 px-6 text-center overflow-hidden">
        <div className="mx-auto max-w-4xl relative p-12 sm:p-24 rounded-[48px] bg-slate-100/50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 shadow-2xl transition-all">
          <div className="absolute inset-0 bg-blue-600/5 dark:bg-blue-600/10 blur-[150px] -z-10" />
          <h2 className="text-4xl sm:text-6xl font-black tracking-tight text-slate-900 dark:text-white mb-8 leading-tight">Your Medical Career Starts Here.</h2>
          <p className="text-lg text-slate-500 dark:text-white/60 mb-12 max-w-md mx-auto">Join thousands of medical students who are studying smarter and achieving better results.</p>
          <Link
            href="/register"
            className="inline-flex items-center h-16 px-12 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-[#05070f] text-xl font-bold hover:scale-105 active:scale-95 transition-all shadow-xl"
          >
            Join MedOneX for Free →
          </Link>
          <p className="mt-8 text-sm text-slate-400 dark:text-white/30">No credit card required • Join in seconds</p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-20 px-6 border-t border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-transparent">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-10">
            <Link href="/" className="flex items-center gap-2 decoration-transparent">
              <MedOneXLogoMark className="h-8 w-8 text-primary" />
              <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">MedOneX</span>
            </Link>
            <div className="flex flex-wrap justify-center gap-8 text-sm font-bold text-slate-400 dark:text-white/40">
              <Link href="#features" className="hover:text-primary transition-colors">Features</Link>
              <Link href="/social" className="hover:text-primary transition-colors">Community</Link>
              <Link href="/privacy" className="hover:text-primary transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-primary transition-colors">Terms</Link>
            </div>
            <div className="flex gap-4">
               <div className="w-10 h-10 rounded-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-400 dark:text-white/40 hover:text-primary hover:border-primary/50 transition-all cursor-pointer shadow-sm">
                  <Target size={18} />
               </div>
               <div className="w-10 h-10 rounded-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-400 dark:text-white/40 hover:text-primary hover:border-primary/50 transition-all cursor-pointer shadow-sm">
                  <Brain size={18} />
               </div>
            </div>
          </div>
          <div className="mt-20 pt-10 border-t border-slate-200 dark:border-white/5 text-center text-sm text-slate-400 dark:text-white/20">
            © 2026 MedOneX. Excellence in medical education.
          </div>
        </div>
      </footer>
    </div>
  );
}
