import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Stethoscope, Zap, Brain, Activity, Heart, Microscope, ArrowRight, CheckCircle2, BookOpen, Trophy, MessageSquare, Clock, ChevronRight, Play, Users, Star, Mail, Github } from "lucide-react";

export default async function LandingPage() {
  const [userCount, questionCount, moduleCount] = await Promise.all([
    prisma.user.count().catch(() => 0),
    prisma.question.count().catch(() => 0),
    prisma.module.count().catch(() => 0),
  ]);

  return (
    <div style={{ minHeight: "100vh", background: "hsl(var(--background))", overflow: "hidden" }}>

      {/* ── TOP NAV ── */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 50,
        borderBottom: "1px solid hsl(var(--border) / .6)",
        backdropFilter: "blur(18px)",
        background: "hsl(var(--background) / .88)",
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {/* Logo */}
          <Link href="/landing" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "hsl(var(--primary))", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Stethoscope style={{ width: 20, height: 20, color: "white" }} />
            </div>
            <span style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 600, letterSpacing: "-.01em" }}>MedQs</span>
          </Link>

          {/* Links */}
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <Link href="/dashboard-app"
              className="btn btn-ghost"
              style={{ fontSize: 13, borderRadius: 8 }}>
              Continue as guest
            </Link>
            <Link href="/modules"
              className="btn btn-ghost"
              style={{ fontSize: 13, borderRadius: 8 }}>
              Browse
            </Link>
            <Link href="/login"
              className="btn btn-secondary"
              style={{ fontSize: 13, padding: "8px 16px", borderRadius: 9 }}>
              Log in
            </Link>
            <Link href="/register"
              className="btn btn-primary"
              style={{ fontSize: 13, padding: "8px 18px", borderRadius: 9 }}>
              Sign up free
              <ArrowRight style={{ width: 14, height: 14 }} />
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "80px 24px 64px", textAlign: "center", position: "relative" }}>

        {/* Background medical animations */}
        <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
          {/* ECG line */}
          <svg style={{ position: "absolute", top: 60, left: 0, right: 0, width: "100%", opacity: .055 }} height="70" viewBox="0 0 1200 70" preserveAspectRatio="none">
            <polyline points="0,35 150,35 175,35 200,8 215,62 230,35 280,35 310,35 325,4 340,66 355,35 400,35 550,35 575,35 600,8 615,62 630,35 680,35 710,35 725,4 740,66 755,35 800,35 950,35 975,35 1000,8 1015,62 1030,35 1080,35 1200,35"
              fill="none" stroke="hsl(var(--primary))" strokeWidth="2"
              style={{ strokeDasharray: 1200, strokeDashoffset: 1200, animation: "draw 4s linear infinite" }} />
          </svg>

          <div style={{ position: "absolute", top: 80, left: 40, opacity: .07 }} className="animate-float">
            <Heart style={{ width: 60, height: 60, color: "#ef4444" }} className="animate-heartbeat" />
          </div>
          <div style={{ position: "absolute", top: 100, right: 60, opacity: .06 }} className="animate-float" >
            <Brain style={{ width: 72, height: 72, color: "hsl(var(--primary))" }} />
          </div>
          <div style={{ position: "absolute", bottom: 20, left: 80, opacity: .05 }} className="animate-float">
            <Microscope style={{ width: 52, height: 52, color: "hsl(var(--primary))" }} />
          </div>
          <div style={{ position: "absolute", bottom: 40, right: 40, opacity: .06 }} className="animate-float">
            <Activity style={{ width: 60, height: 60, color: "hsl(240 80% 65%)" }} />
          </div>

          {/* Gradient orbs */}
          <div style={{ position: "absolute", top: -60, left: "20%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, hsl(var(--primary) / .08), transparent)", filter: "blur(60px)" }} />
          <div style={{ position: "absolute", top: -40, right: "20%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, hsl(240 80% 65% / .06), transparent)", filter: "blur(60px)" }} />
        </div>

        {/* Badge */}
        <div className="animate-fade-in" style={{ display: "inline-flex", alignItems: "center", gap: 8, borderRadius: 20, border: "1px solid hsl(var(--primary) / .25)", background: "hsl(var(--primary) / .07)", padding: "5px 14px", fontSize: 12, fontWeight: 500, color: "hsl(var(--primary))", marginBottom: 32 }}>
          <Zap style={{ width: 13, height: 13 }} />
          AI-Powered Medical Education · Free with Gemini
        </div>

        {/* Headline */}
        <h1 className="animate-fade-up gradient-text" style={{ fontFamily: "var(--font-display)", fontSize: "clamp(44px, 7vw, 72px)", fontWeight: 700, lineHeight: 1.05, letterSpacing: "-.03em", marginBottom: 20, animationDelay: ".05s" }}>
          Study medicine smarter,<br />not harder
        </h1>

        <p className="animate-fade-up" style={{ fontSize: "clamp(15px, 2vw, 18px)", color: "hsl(var(--muted-foreground))", maxWidth: 540, margin: "0 auto 36px", lineHeight: 1.65, animationDelay: ".1s" }}>
          Access your curriculum, practice past papers, get instant AI explanations, collaborate in forums, and track your progress.
        </p>

        {/* CTA */}
        <div className="animate-fade-up" style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", animationDelay: ".14s" }}>
          <Link href="/register" className="btn btn-primary" style={{ fontSize: 15, padding: "12px 28px", boxShadow: "0 8px 28px hsl(var(--primary) / .4)" }}>
            Get started free
            <ArrowRight style={{ width: 16, height: 16 }} />
          </Link>
          <Link href="/modules" className="btn btn-secondary" style={{ fontSize: 15, padding: "12px 22px" }}>
            <Play style={{ width: 15, height: 15 }} />
            Browse content
          </Link>
        </div>

        {/* Stats */}
        <div className="animate-fade-up" style={{ marginTop: 56, display: "flex", justifyContent: "center", gap: 48, flexWrap: "wrap", animationDelay: ".2s" }}>
          {[
            { value: userCount.toLocaleString() + "+", label: "students" },
            { value: questionCount.toLocaleString() + "+", label: "questions" },
            { value: moduleCount.toLocaleString() + "+", label: "modules" },
            { value: "100%", label: "free AI" },
          ].map(({ value, label }) => (
            <div key={label} style={{ textAlign: "center" }}>
              <p style={{ fontFamily: "var(--font-display)", fontSize: 30, fontWeight: 700, margin: 0 }}>{value}</p>
              <p style={{ fontSize: 13, color: "hsl(var(--muted-foreground))", margin: "2px 0 0" }}>{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px 80px" }}>
        <div style={{ textAlign: "center", marginBottom: 52 }}>
          <p style={{ fontSize: 13, fontWeight: 500, color: "hsl(var(--primary))", marginBottom: 10 }}>Everything you need</p>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 700, letterSpacing: "-.02em", margin: "0 0 12px" }}>Built for medical students</h2>
          <p style={{ color: "hsl(var(--muted-foreground))", maxWidth: 440, margin: "0 auto" }}>Every feature designed around how you actually study medicine.</p>
        </div>

        <div className="stagger" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
          {[
            { icon: BookOpen,     color: "#3b82f6", bg: "#3b82f608", title: "Structured curriculum",    desc: "University → Year → Semester → Module → Subject → Lecture. Find anything instantly." },
            { icon: Zap,          color: "#8b5cf6", bg: "#8b5cf608", title: "AI explanations",          desc: "Instant AI-generated explanations for every question. Powered by Google Gemini — free." },
            { icon: Trophy,       color: "#f59e0b", bg: "#f59e0b08", title: "Gamification & ranks",     desc: "Earn points, level up from Newbie to Elite, compete on the leaderboard." },
            { icon: MessageSquare,color: "#10b981", bg: "#10b98108", title: "Study forums",             desc: "Global, semester-specific, and private study groups — invite friends by student ID." },
            { icon: Brain,        color: "#f43f5e", bg: "#f43f5e08", title: "Dr. Q AI tutor",           desc: "Your personal medical AI tutor. Ask anything medical, get expert-level answers." },
            { icon: Clock,        color: "#06b6d4", bg: "#06b6d408", title: "Study Space",              desc: "Pomodoro timer, task list, Spotify, drawing canvas — your personal focus board." },
          ].map(({ icon: Icon, color, bg, title, desc }) => (
            <div key={title} className="card-hover rounded-2xl border border-border bg-card p-6">
              <div style={{ display: "inline-flex", borderRadius: 12, padding: 11, background: bg, marginBottom: 16 }}>
                <Icon style={{ width: 22, height: 22, color }} />
              </div>
              <h3 style={{ fontFamily: "var(--font-display)", fontSize: 17, fontWeight: 600, margin: "0 0 8px" }}>{title}</h3>
              <p style={{ fontSize: 13.5, color: "hsl(var(--muted-foreground))", margin: 0, lineHeight: 1.6 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: "1px solid hsl(var(--border))", padding: "48px 0 32px" }} id="contact">
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 32, marginBottom: 40 }}>
            {/* Brand */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: "hsl(var(--primary))", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Stethoscope style={{ width: 18, height: 18, color: "white" }} />
                </div>
                <span style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 600 }}>MedQs</span>
              </div>
              <p style={{ fontSize: 13, color: "hsl(var(--muted-foreground))", lineHeight: 1.6 }}>AI-powered medical education. Study smarter, score higher.</p>
            </div>

            {/* Platform */}
            <div>
              <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".07em", color: "hsl(var(--muted-foreground))", marginBottom: 12 }}>Platform</p>
              {[["Browse content", "/modules"], ["Leaderboard", "/leaderboard"], ["Study Space", "/space"], ["Forum", "/forum"]].map(([l, h]) => (
                <Link key={l} href={h} style={{ display: "block", fontSize: 13, color: "hsl(var(--muted-foreground))", textDecoration: "none", marginBottom: 8, transition: "color .12s" }}
                  onMouseEnter={e => e.currentTarget.style.color = "hsl(var(--foreground))"}
                  onMouseLeave={e => e.currentTarget.style.color = "hsl(var(--muted-foreground))"}>
                  {l}
                </Link>
              ))}
            </div>

            {/* Account */}
            <div>
              <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".07em", color: "hsl(var(--muted-foreground))", marginBottom: 12 }}>Account</p>
              {[["Log in", "/login"], ["Sign up", "/register"], ["Guest browse", "/modules"]].map(([l, h]) => (
                <Link key={l} href={h} style={{ display: "block", fontSize: 13, color: "hsl(var(--muted-foreground))", textDecoration: "none", marginBottom: 8, transition: "color .12s" }}
                  onMouseEnter={e => e.currentTarget.style.color = "hsl(var(--foreground))"}
                  onMouseLeave={e => e.currentTarget.style.color = "hsl(var(--muted-foreground))"}>
                  {l}
                </Link>
              ))}
            </div>

            {/* Support */}
            <div>
              <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".07em", color: "hsl(var(--muted-foreground))", marginBottom: 12 }}>Support</p>
              <a href="mailto:support@medqs.app" style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13, color: "hsl(var(--muted-foreground))", textDecoration: "none", marginBottom: 8 }}>
                <Mail style={{ width: 13, height: 13 }} /> support@medqs.app
              </a>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13, color: "hsl(var(--muted-foreground))", textDecoration: "none" }}>
                <Github style={{ width: 13, height: 13 }} /> GitHub
              </a>
            </div>
          </div>

          <div style={{ borderTop: "1px solid hsl(var(--border))", paddingTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <p style={{ fontSize: 12, color: "hsl(var(--muted-foreground))", margin: 0 }}>© 2025 MedQs. Built for medical students.</p>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "hsl(var(--muted-foreground))" }}>
              Made with
              <Heart style={{ width: 12, height: 12, color: "#ef4444" }} className="animate-heartbeat" />
              for future doctors
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
