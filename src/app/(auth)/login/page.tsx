import { signIn } from "@/lib/auth";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { MedQsLogoMark } from "@/components/branding/MedQsLogo";
import { PLATFORM_COPY } from "@/lib/platform-copy";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Users, BookOpen } from "lucide-react";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-white dark:bg-[#080c14]">

      {/* ── LEFT PANEL (branding) — hidden on mobile ── */}
      <div className="relative hidden flex-1 flex-col justify-between overflow-hidden lg:flex"
        style={{ background: "linear-gradient(145deg, #0f1729 0%, #111827 60%, #0c1320 100%)" }}>

        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-[0.06]"
          style={{ backgroundImage: "linear-gradient(rgba(100,150,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(100,150,255,1) 1px, transparent 1px)", backgroundSize: "50px 50px" }} />

        {/* Glow orb */}
        <div className="absolute -top-1/4 -left-1/4 h-3/4 w-3/4 rounded-full blur-[140px]"
          style={{ background: "radial-gradient(circle, rgba(26,107,204,0.25) 0%, transparent 60%)" }} />
        <div className="absolute -bottom-1/4 -right-1/4 h-2/3 w-2/3 rounded-full blur-[120px]"
          style={{ background: "radial-gradient(circle, rgba(107,72,204,0.15) 0%, transparent 60%)" }} />

        <div className="relative z-10 p-10">
          <div className="flex items-center gap-3">
            <span style={{ filter: "brightness(0) invert(1)" }}>
              <MedQsLogoMark className="h-10 w-10" title="MedQs" />
            </span>
            <span className="text-xl font-bold text-white tracking-tight">MedQs</span>
          </div>
        </div>

        <div className="relative z-10 px-10 pb-8">
          <h2 className="mb-3 font-display text-3xl font-extrabold leading-tight text-white">
            Your path to<br />
            <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
              medical excellence.
            </span>
          </h2>
          <p className="mb-8 text-sm leading-relaxed text-white/60">
            Structured curriculums, exam simulators, AI study notes, and a thriving community — all in one place.
          </p>

          <div className="space-y-3">
            {[
              { icon: BookOpen, text: "Structured curriculum matched to your university", color: "#1A6BCC" },
              { icon: ShieldCheck, text: "AI-powered study tools & smart flashcards", color: "#6B48CC" },
              { icon: Users, text: "Join 1,000+ students mastering medicine", color: "#059669" },
            ].map(({ icon: Icon, text, color }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl"
                  style={{ background: `${color}22` }}>
                  <Icon className="h-4 w-4" style={{ color }} />
                </div>
                <p className="text-sm text-white/70">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL (form) ── */}
      <div className="flex flex-1 flex-col items-center justify-center px-5 py-10 lg:max-w-[480px]">
        {/* Mobile logo */}
        <div className="mb-6 flex items-center gap-2.5 lg:hidden">
          <MedQsLogoMark className="h-8 w-8" title="MedQs" />
          <span className="text-base font-bold tracking-tight text-foreground">MedQs</span>
        </div>

        <div className="w-full max-w-[340px] sm:max-w-[360px]">
          <h1 className="mb-1 font-display text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">
            Welcome back
          </h1>
          <p className="mb-6 sm:mb-8 text-sm text-muted-foreground">
            Sign in to continue your medical studies.
          </p>

          {/* ── OAUTH BUTTONS ── */}
          <div className="space-y-3">

            {/* Google */}
            <form action={async () => {
              "use server";
              await signIn("google", { redirectTo: "/dashboard" });
            }}>
              <button type="submit"
                className="group flex w-full items-center gap-4 rounded-2xl border border-border/60 bg-background/80 px-5 py-3.5 text-sm font-semibold text-foreground shadow-sm transition-all hover:border-blue-500/40 hover:bg-muted/40 hover:shadow-md active:scale-[0.98] dark:bg-white/5 dark:hover:bg-white/8">
                {/* Custom G icon (not Google branded) */}
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-sm">
                  <svg className="h-4 w-4 fill-white" viewBox="0 0 24 24" aria-hidden>
                    <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"/>
                  </svg>
                </div>
                <span className="flex-1 text-left">Continue with Google</span>
                <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </button>
            </form>

            {/* Facebook */}
            <form action={async () => {
              "use server";
              await signIn("facebook", { redirectTo: "/dashboard" });
            }}>
              <button type="submit"
                className="group flex w-full items-center gap-4 rounded-2xl border border-border/60 bg-background/80 px-5 py-3.5 text-sm font-semibold text-foreground shadow-sm transition-all hover:border-blue-600/40 hover:bg-muted/40 hover:shadow-md active:scale-[0.98] dark:bg-white/5 dark:hover:bg-white/8">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#1877F2] to-[#0d65d9] shadow-sm">
                  <svg className="h-4 w-4 fill-white" viewBox="0 0 24 24" aria-hidden>
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </div>
                <span className="flex-1 text-left">Continue with Facebook</span>
                <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </button>
            </form>
          </div>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="flex-1 border-t border-border/60" />
            <span className="text-xs text-muted-foreground">or</span>
            <div className="flex-1 border-t border-border/60" />
          </div>

          {/* Guest access */}
          <Link href="/guest/past-papers"
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border/60 bg-background/40 px-5 py-3 text-sm font-medium text-muted-foreground transition-all hover:bg-muted/30 hover:text-foreground dark:bg-white/3 dark:hover:bg-white/6">
            Browse as Guest (no account)
          </Link>

          {/* Legal */}
          <p className="mt-6 text-center text-[11px] leading-relaxed text-muted-foreground">
            By continuing, you agree to our{" "}
            <a href="/terms" className="text-blue-500 hover:underline">Terms</a>
            {" "}and{" "}
            <a href="/privacy" className="text-blue-500 hover:underline">Privacy Policy</a>.
          </p>

          {/* Doctor hint */}
          <p className="mt-3 rounded-xl border border-border/40 bg-muted/30 px-3 py-2.5 text-center text-[11px] leading-relaxed text-muted-foreground dark:bg-white/3">
            {PLATFORM_COPY.loginDoctorHint}{" "}
            <Link href="/doctor" className="font-semibold text-blue-500 hover:underline">
              {PLATFORM_COPY.landingForDoctorsCta}
            </Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
