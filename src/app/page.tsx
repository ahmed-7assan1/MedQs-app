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
    <div style={{ minHeight: "100vh", backgroundColor: "#040808", overflow: "hidden", color: "#f8fafc" }}>
      
      {/* ── AMBIENT MESH GRID & GRADIENTS ── */}
      <div 
        style={{ 
          position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
          backgroundImage: "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          backgroundPosition: "center center",
          opacity: 0.8
        }} 
      />
      
      <div style={{
        position: "fixed", top: "-15%", left: "-10%", width: "50%", height: "70%",
        background: "radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 60%)",
        filter: "blur(120px)", zIndex: 0, pointerEvents: "none"
      }} />
      <div style={{
        position: "fixed", bottom: "-20%", right: "-10%", width: "60%", height: "60%",
        background: "radial-gradient(circle, rgba(37,99,235,0.12) 0%, transparent 60%)",
        filter: "blur(120px)", zIndex: 0, pointerEvents: "none"
      }} />

      {/* ── TOP NAV ── */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 50,
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        backgroundColor: "rgba(4, 8, 8, 0.65)",
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", height: 72, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {/* Logo */}
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 12, textDecoration: "none" }}>
            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", inset: 0, background: "rgba(59,130,246,0.5)", filter: "blur(12px)", borderRadius: "50%" }}></div>
              <MedQsLogoMark className="h-9 w-9 shrink-0 relative z-10" title="MedQs" />
            </div>
            <MedQsWordmark className="text-xl font-bold tracking-tight text-white" />
          </Link>

          {/* Links */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Link href="/login"
              className="text-slate-200 hover:text-white transition-colors duration-200"
              style={{ 
                fontSize: 14, fontWeight: 500, padding: "10px 20px", borderRadius: 12,
                textDecoration: "none"
              }}
            >
              Sign In
            </Link>
            <Link href="/register"
              className="hover:scale-[1.02] active:scale-[0.98] transition-transform duration-300"
              style={{ 
                display: "inline-flex", alignItems: "center", gap: 8,
                fontSize: 14, fontWeight: 600, padding: "10px 24px", borderRadius: 12,
                background: "linear-gradient(135deg, rgba(59,130,246,0.9), rgba(37,99,235,1))",
                color: "#fff", textDecoration: "none",
                boxShadow: "0 8px 30px rgba(59,130,246,0.3)"
              }}
            >
              Get Started Free
              <ArrowRight style={{ width: 16, height: 16 }} />
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ maxWidth: 1000, margin: "0 auto", padding: "120px 24px 80px", textAlign: "center", position: "relative", zIndex: 10 }}>
        
        <ScrollReveal>
          {/* Badge */}
          <div className="animate-fade-in" style={{ 
            display: "inline-flex", alignItems: "center", gap: 8, borderRadius: 100, 
            border: "1px solid rgba(59,130,246,0.3)", background: "rgba(59,130,246,0.1)", 
            padding: "8px 18px", fontSize: 13, fontWeight: 600, color: "#60a5fa", 
            marginBottom: 36, backdropFilter: "blur(8px)",
            boxShadow: "0 0 20px rgba(59,130,246,0.1) inset"
          }}>
            <ShieldCheck style={{ width: 16, height: 16 }} />
            The Ultimate Medical Study Platform
          </div>

          {/* Headline */}
          <h1 className="animate-fade-up" style={{ 
            fontFamily: "var(--font-display)", fontSize: "clamp(48px, 8vw, 84px)", 
            fontWeight: 800, lineHeight: 1.05, letterSpacing: "-0.04em", 
            marginBottom: 24, animationDelay: ".05s", color: "#ffffff" 
          }}>
            Master Medicine<br />
            <span style={{ 
              background: "linear-gradient(to right, #60a5fa, #818cf8, #a78bfa)", 
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              filter: "drop-shadow(0px 10px 30px rgba(96,165,250,0.2))"
            }}>With Precision.</span>
          </h1>

          <p className="animate-fade-up" style={{ 
            fontSize: "clamp(16px, 2vw, 20px)", color: "#94a3b8", 
            maxWidth: 600, margin: "0 auto 48px", lineHeight: 1.7, 
            animationDelay: ".1s", letterSpacing: "0.01em"
          }}>
            Access perfectly structured curriculums, dive into detailed past-paper explanations, map your progress, and join a vibrant community of elite future doctors.
          </p>

          {/* CTA */}
          <div className="animate-fade-up" style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap", animationDelay: ".14s" }}>
            <Link href="/register" 
              className="hover:-translate-y-1 transition-transform duration-200"
              style={{ 
                display: "inline-flex", alignItems: "center", gap: 10,
                fontSize: 16, fontWeight: 600, padding: "16px 36px", borderRadius: 14,
                background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
                color: "#fff", textDecoration: "none",
                boxShadow: "0 10px 40px -10px rgba(37,99,235,0.6), inset 0 1px 0 rgba(255,255,255,0.2)"
              }}
            >
              Join Now
              <ArrowRight style={{ width: 18, height: 18 }} />
            </Link>
            <Link href="/modules" 
              className="hover:bg-white/10 transition-colors duration-200"
              style={{ 
                display: "inline-flex", alignItems: "center", gap: 10,
                fontSize: 16, fontWeight: 500, padding: "16px 32px", borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.03)",
                color: "#f8fafc", textDecoration: "none", backdropFilter: "blur(12px)"
              }}
            >
              <Play style={{ width: 18, height: 18, fill: "currentColor" }} />
              Preview Curriculum
            </Link>
          </div>

          {/* Stats */}
          <div className="animate-fade-up" style={{ 
            marginTop: 72, display: "flex", justifyContent: "center", gap: "clamp(30px, 8vw, 80px)", 
            flexWrap: "wrap", animationDelay: ".2s" 
          }}>
            {[
              { value: userCount.toLocaleString() + "+", label: "Active Students" },
              { value: questionCount.toLocaleString() + "+", label: "Bank Questions" },
              { value: moduleCount.toLocaleString() + "+", label: "Modules Covered" },
            ].map(({ value, label }) => (
              <div key={label} style={{ textAlign: "center" }}>
                <p style={{ fontFamily: "var(--font-display)", fontSize: "clamp(32px, 4vw, 42px)", fontWeight: 800, margin: 0, color: "#fff", textShadow: "0 4px 20px rgba(0,0,0,0.5)" }}>{value}</p>
                <p style={{ fontSize: 14, fontWeight: 500, color: "#64748b", margin: "6px 0 0", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</p>
              </div>
            ))}
          </div>
        </ScrollReveal>
      </section>

      {/* ── FEATURES ── */}
      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 24px 100px", position: "relative", zIndex: 10 }}>
        <ScrollReveal>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "#60a5fa", fontWeight: 600, fontSize: 13, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 16 }}>
              <Target style={{ width: 16, height: 16 }} />
              Elite Toolset
            </div>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(32px, 5vw, 48px)", fontWeight: 800, letterSpacing: "-0.03em", margin: "0 0 16px", color: "#fff" }}>
              Built for the Rigors of Med School
            </h2>
            <p style={{ color: "#94a3b8", maxWidth: 540, margin: "0 auto", fontSize: 18, lineHeight: 1.6 }}>
              Everything you need to master complex subjects and conquer your exams faster than ever.
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal delayMs={100} className="block">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 24 }}>
            {[
              { icon: BookOpen, color: "#60a5fa", gradient: "from-[#60a5fa] to-[#2563eb]", title: "Structured Curriculum", desc: "University → Year → Semester → Module → Subject → Lecture. Never get lost." },
              { icon: Layers, color: "#818cf8", gradient: "from-[#818cf8] to-[#4f46e5]", title: "Active Recall", desc: "Turn any concept into actionable flashcards to build long-term retention seamlessly." },
              { icon: ClipboardList, color: "#f472b6", gradient: "from-[#f472b6] to-[#db2777]", title: "Exam Simulator", desc: "Solve fully-timed past papers with detailed rationales for every single option." },
              { icon: MessageSquare, color: "#34d399", gradient: "from-[#34d399] to-[#059669]", title: "Collaborative Forums", desc: "Global, semester-specific, and private discussion groups specifically for your cohort." },
              { icon: Trophy, color: "#fbbf24", gradient: "from-[#fbbf24] to-[#d97706]", title: "Gamified Leaderboards", desc: "Earn experience points, acquire mastery badges, and climb the ranks among your peers." },
              { icon: Clock, color: "#38bdf8", gradient: "from-[#38bdf8] to-[#0284c7]", title: "Deep Study Workspace", desc: "Integrated Pomodoro timer, dynamic task list, and a canvas to sketch pathways while studying." },
            ].map(({ icon: Icon, color, gradient, title, desc }) => (
              <div 
                key={title} 
                className="group relative overflow-hidden rounded-2xl transition-all duration-400 ease-in-out hover:-translate-y-1 hover:shadow-2xl hover:border-white/20"
                style={{ 
                  background: "rgba(255,255,255,0.02)", 
                  border: "1px solid rgba(255,255,255,0.06)", 
                  backdropFilter: "blur(12px)"
                }}
              >
                {/* Hover Glow */}
                <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
                <div className="relative p-8">
                  <div className="transition-transform duration-300 ease-in-out group-hover:scale-110"
                    style={{ 
                    display: "inline-flex", borderRadius: 14, padding: 14, 
                    background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.05)",
                    marginBottom: 20, boxShadow: `0 8px 16px -4px ${color}33`
                  }}>
                    <Icon style={{ width: 26, height: 26, color }} />
                  </div>
                  <h3 style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 700, margin: "0 0 10px", color: "#f8fafc" }}>{title}</h3>
                  <p style={{ fontSize: 15, color: "#94a3b8", margin: 0, lineHeight: 1.6 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </ScrollReveal>
      </section>

      {/* ── DOCTORS & FACULTY ── */}
      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px 100px", position: "relative", zIndex: 10 }}>
        <ScrollReveal>
          <div style={{ 
            position: "relative",
            borderRadius: 32, 
            background: "linear-gradient(135deg, rgba(59,130,246,0.08), rgba(0,0,0,0.4))",
            border: "1px solid rgba(59,130,246,0.2)",
            padding: "clamp(30px, 6vw, 60px)",
            overflow: "hidden",
            boxShadow: "0 40px 80px -20px rgba(37,99,235,0.2)"
          }}>
            <div style={{ position: "absolute", top: 0, right: 0, width: "50%", height: "100%", background: "radial-gradient(ellipse at right, rgba(59,130,246,0.1), transparent 70%)", pointerEvents: "none" }} />
            
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 40, position: "relative", zIndex: 1 }}>
              <div style={{ flex: "1 1 500px" }}>
                <div style={{ 
                  display: "inline-flex", alignItems: "center", gap: 8, borderRadius: 100, 
                  background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", 
                  padding: "6px 16px", fontSize: 13, fontWeight: 600, color: "#f8fafc", marginBottom: 20 
                }}>
                  <GraduationCap style={{ width: 16, height: 16 }} aria-hidden />
                  {PLATFORM_COPY.landingForDoctorsEyebrow}
                </div>
                <h2 style={{ 
                  fontFamily: "var(--font-display)", fontSize: "clamp(28px, 4vw, 40px)", 
                  fontWeight: 800, letterSpacing: "-0.02em", margin: "0 0 16px", color: "#fff", lineHeight: 1.15
                }}>
                  {PLATFORM_COPY.landingForDoctorsTitle}
                </h2>
                <p style={{ fontSize: 17, color: "#cbd5e1", margin: "0 0 20px", lineHeight: 1.7 }}>
                  {PLATFORM_COPY.landingForDoctorsBody}
                </p>
                <p dir="rtl" style={{ fontSize: 16, color: "#94a3b8", margin: 0, lineHeight: 1.8, background: "rgba(0,0,0,0.2)", padding: 16, borderRadius: 12, border: "1px solid rgba(255,255,255,0.05)" }}>
                  {PLATFORM_COPY.landingForDoctorsArabic}
                </p>
              </div>
              <div style={{ flex: "0 0 auto" }}>
                <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", padding: 32, borderRadius: 24, backdropFilter: "blur(12px)" }}>
                  <Link href="/login" 
                    className="hover:-translate-y-1 transition-transform duration-200"
                    style={{ 
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                    fontSize: 16, fontWeight: 600, padding: "16px 32px", borderRadius: 14,
                    background: "#f8fafc", color: "#0f172a", textDecoration: "none",
                    boxShadow: "0 10px 30px rgba(255,255,255,0.15)"
                  }}
                  >
                    Staff Login
                    <ArrowRight style={{ width: 18, height: 18 }} />
                  </Link>
                  <p style={{ margin: "16px 0 0", fontSize: 13, color: "#64748b", textAlign: "center", lineHeight: 1.6 }}>
                    Direct access via{" "}
                    <Link href="/doctor" className="hover:text-blue-400 transition-colors" style={{ color: "#60a5fa", fontWeight: 500, textDecoration: "none" }}>/doctor</Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "64px 0 40px", backgroundColor: "rgba(0,0,0,0.4)", position: "relative", zIndex: 10 }} id="contact">
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 40, marginBottom: 60 }}>
            <div style={{ gridColumn: "span 2" }}>
              <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 12, marginBottom: 20, textDecoration: "none" }}>
                <MedQsLogoMark className="h-8 w-8 shrink-0" title="MedQs" />
                <MedQsWordmark className="text-xl font-bold" />
              </Link>
              <p style={{ fontSize: 15, color: "#94a3b8", lineHeight: 1.7, maxWidth: 320 }}>
                Elevating medical education with precision tools, structured curriculums, and an unstoppable community.
              </p>
            </div>
            
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#f8fafc", marginBottom: 20 }}>Features</p>
              {[["Curriculum", "/modules"], ["Flashcards", "/study-tools"], ["Leaderboard", "/leaderboard"], ["Study Space", "/space"], ["Discussions", "/forum"]].map(([l, h]) => (
                <Link key={l} href={h} className="hover:text-blue-400 transition-colors duration-200" style={{ display: "block", marginBottom: 12, fontSize: 14, color: "#94a3b8", textDecoration: "none" }}>
                  {l}
             </Link>
              ))}
            </div>

            <div>
              <p style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#f8fafc", marginBottom: 20 }}>Account</p>
              {[["Sign In", "/login"], ["Create Account", "/register"], ["Faculty Portal", "/doctor"], ["Guest Access", "/modules"]].map(([l, h]) => (
                <Link key={l} href={h} className="hover:text-blue-400 transition-colors duration-200" style={{ display: "block", marginBottom: 12, fontSize: 14, color: "#94a3b8", textDecoration: "none" }}>
                  {l}
                </Link>
              ))}
            </div>

            <div>
              <p style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#f8fafc", marginBottom: 20 }}>Connect</p>
              <a href="mailto:support@medqs.app" className="hover:text-blue-400 transition-colors duration-200" style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "#94a3b8", textDecoration: "none", marginBottom: 12 }}>
                <Mail style={{ width: 16, height: 16 }} /> Contact Support
              </a>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition-colors duration-200" style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "#94a3b8", textDecoration: "none" }}>
                <Github style={{ width: 16, height: 16 }} /> GitHub Source
              </a>
            </div>
          </div>

          <div style={{ 
            borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 32, 
            display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 
          }}>
            <p style={{ fontSize: 14, color: "#64748b", margin: 0 }}>© 2026 MedQs. Excellence in medical education.</p>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "#64748b" }}>
              Crafted with
              <Heart style={{ width: 14, height: 14, color: "#f43f5e" }} className="animate-heartbeat" />
              for future healthcare leaders
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
