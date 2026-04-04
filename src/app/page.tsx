import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { MedQsLogoMark, MedQsWordmark } from "@/components/branding/MedQsLogo";

export default async function RootPage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  // Fetch site config for dynamic branding
  const siteConfig = await prisma.siteConfig.findFirst({
    select: { siteName: true, logoUrl: true, primaryColor: true },
  }).catch(() => null);

  const siteName = siteConfig?.siteName ?? "MedQs";
  const logoUrl = siteConfig?.logoUrl?.trim() || null;

  return (
    <div style={{
      minHeight: "100vh",
      background: "#08090d",
      fontFamily: "'Geist', system-ui, sans-serif",
      overflowX: "hidden",
    }}>
      {/* Ambient background */}
      <div
        className="landing-root-ambient"
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 0,
          background: `
          radial-gradient(ellipse 80% 60% at 50% -10%, rgba(59,130,246,0.12) 0%, transparent 70%),
          radial-gradient(ellipse 40% 40% at 80% 80%, rgba(99,102,241,0.06) 0%, transparent 60%)
        `,
        }}
      />

      {/* Subtle grid — CSS-animated drift (see .landing-root-grid in globals.css) */}
      <div
        className="landing-root-grid"
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 0,
          backgroundImage: `
          linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px)
        `,
          backgroundSize: "48px 48px",
        }}
      />

      {/* Top nav */}
      <nav
        className="landing-root-nav-anim"
        style={{
          position: "relative",
          zIndex: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "20px 40px",
          borderBottom: "1px solid rgba(255,255,255,0.04)",
        }}
      >
        <Link
          href="/"
          style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}
        >
          {logoUrl ? (
            <>
              <img
                src={logoUrl}
                alt={siteName}
                width={32}
                height={32}
                style={{ borderRadius: 8, objectFit: "contain" }}
              />
              <span
                style={{
                  fontFamily: "'Sora', system-ui, sans-serif",
                  fontWeight: 700,
                  fontSize: 18,
                  color: "white",
                  letterSpacing: "-0.02em",
                }}
              >
                {siteName}
              </span>
            </>
          ) : (
            <>
              <MedQsLogoMark variant="onDark" className="h-8 w-8 shrink-0" title={siteName} />
              {siteName === "MedQs" ? (
                <MedQsWordmark variant="onDark" className="text-lg" />
              ) : (
                <span
                  style={{
                    fontFamily: "'Sora', system-ui, sans-serif",
                    fontWeight: 700,
                    fontSize: 18,
                    color: "white",
                    letterSpacing: "-0.02em",
                  }}
                >
                  {siteName}
                </span>
              )}
            </>
          )}
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/register" style={{
            fontSize: 13, color: "rgba(255,255,255,0.68)",
            textDecoration: "none", padding: "6px 12px", borderRadius: 8,
            border: "1px solid rgba(255,255,255,0.1)",
            transition: "background 0.15s",
          }}>
            Register
          </Link>
          <Link href="/dashboard" style={{
            fontSize: 13, color: "rgba(255,255,255,0.45)",
            textDecoration: "none", padding: "6px 12px", borderRadius: 8,
            transition: "color 0.15s",
          }}>
            Browse →
          </Link>
          <Link href="/login" style={{
            fontSize: 13, fontWeight: 500, color: "white",
            textDecoration: "none", padding: "7px 16px",
            borderRadius: 8, background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.1)",
            transition: "background 0.15s",
          }}>
            Sign in
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{
        position: "relative", zIndex: 1,
        maxWidth: 800, margin: "0 auto",
        padding: "100px 40px 80px",
        textAlign: "center",
      }}>
        {/* Badge */}
        <div
          className="landing-root-hero-anim"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "4px 14px",
            borderRadius: 20,
            background: "rgba(59,130,246,0.08)",
            border: "1px solid rgba(59,130,246,0.2)",
            color: "rgba(147,197,253,0.9)",
            fontSize: 12,
            fontWeight: 500,
            marginBottom: 32,
            letterSpacing: "0.02em",
            animationDelay: "0.06s",
          }}
        >
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#3b82f6", display: "inline-block" }}/>
          AI-Powered Medical Education
        </div>

        <h1
          className="landing-root-hero-anim"
          style={{
            fontFamily: "'Fraunces', Georgia, serif",
            fontSize: "clamp(42px, 6vw, 72px)",
            fontWeight: 800,
            lineHeight: 1.08,
            letterSpacing: "-0.04em",
            color: "white",
            marginBottom: 24,
            animationDelay: "0.12s",
          }}
        >
          Study smarter,<br/>
          <span style={{
            background: "linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>
            score higher
          </span>
        </h1>

        <p
          className="landing-root-hero-anim"
          style={{
            fontSize: 17,
            lineHeight: 1.65,
            color: "rgba(255,255,255,0.45)",
            maxWidth: 520,
            margin: "0 auto 48px",
            animationDelay: "0.18s",
          }}
        >
          Your university's complete medical education platform.
          Lectures, practice questions, AI explanations, and study tools — all in one place.
        </p>

        <div
          className="landing-root-hero-anim"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            flexWrap: "wrap",
            animationDelay: "0.24s",
          }}
        >
          <Link
            href="/login"
            className="landing-root-cta-glow"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "12px 28px",
              borderRadius: 10,
              background: "linear-gradient(135deg, #3b82f6, #6366f1)",
              color: "white",
              fontWeight: 600,
              fontSize: 14,
              textDecoration: "none",
              boxShadow: "0 4px 24px rgba(59,130,246,0.3)",
            }}
          >
            Get started free
            <span style={{ fontSize: 16 }}>→</span>
          </Link>
          <Link
            href="/dashboard"
            className="landing-root-secondary-cta"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "12px 24px",
              borderRadius: 10,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "rgba(255,255,255,0.65)",
              fontWeight: 500,
              fontSize: 14,
              textDecoration: "none",
            }}
          >
            Browse as guest
          </Link>
        </div>
      </section>

      {/* Features grid */}
      <section style={{
        position: "relative", zIndex: 1,
        maxWidth: 960, margin: "0 auto", padding: "0 40px 80px",
        display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16,
      }}>
        {[
          {
            icon: "🧠", title: "AI Explanations",
            desc: "Tap any question for an instant Gemini-powered explanation tailored to your level.",
          },
          {
            icon: "📚", title: "Structured Content",
            desc: "Lectures, flashcards, and videos organized by module, subject, and semester.",
          },
          {
            icon: "📝", title: "Past Papers",
            desc: "Practice with timed past exams and review every answer in detail.",
          },
          {
            icon: "🎯", title: "Progress Tracking",
            desc: "Per-module progress bars show exactly how much you've covered.",
          },
          {
            icon: "💬", title: "Forum & Community",
            desc: "Ask questions and discuss topics with students in your semester.",
          },
          {
            icon: "🏆", title: "Leaderboard",
            desc: "Earn points, climb ranks from Newbie to Elite, compete with peers.",
          },
        ].map(({ icon, title, desc }, i) => (
          <div
            key={title}
            className="landing-root-card landing-root-hero-anim"
            style={{
              padding: "24px",
              borderRadius: 14,
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
              animationDelay: `${0.3 + i * 0.055}s`,
            }}
          >
            <div style={{ fontSize: 28, marginBottom: 12 }}>{icon}</div>
            <h3 style={{
              fontFamily: "'Fraunces', Georgia, serif",
              fontSize: 16, fontWeight: 600, color: "white",
              marginBottom: 8, letterSpacing: "-0.01em",
            }}>
              {title}
            </h3>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", lineHeight: 1.6 }}>
              {desc}
            </p>
          </div>
        ))}
      </section>

      {/* CTA footer */}
      <section
        className="landing-root-hero-anim"
        style={{
          position: "relative",
          zIndex: 1,
          textAlign: "center",
          padding: "60px 40px 80px",
          borderTop: "1px solid rgba(255,255,255,0.04)",
          animationDelay: "0.65s",
        }}
      >
        <p
          style={{
            fontFamily: "'Fraunces', Georgia, serif",
            fontSize: 28,
            fontWeight: 700,
            color: "white",
            letterSpacing: "-0.02em",
            marginBottom: 20,
          }}
        >
          Ready to ace your exams?
        </p>
        <Link
          href="/login"
          className="landing-root-secondary-cta"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "11px 24px",
            borderRadius: 10,
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "white",
            fontWeight: 500,
            fontSize: 14,
            textDecoration: "none",
          }}
        >
          Create your account →
        </Link>
      </section>
    </div>
  );
}
