"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2, CheckCircle, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import { NewAuthShell } from "@/components/auth/NewAuthShell";
import { NewAuthForm, type AuthField } from "@/components/auth/NewAuthForm";
import { DesktopAuthLayout } from "@/components/auth/DesktopAuthLayout";
import { ProfileCompletionForm } from "@/components/auth/ProfileCompletionForm";

function AuthContent() {
  const sp = useSearchParams();
  const supabase = createClient();

  type AuthMode = "login" | "register" | "forgot-password" | "complete-profile";
  const q = sp.get("mode");
  const [mode, setMode] = useState<AuthMode>(
    q === "complete-profile" ? "complete-profile"
      : ["register", "onboarding"].includes(q || "") ? "register"
      : "login"
  );
  const [loading, setLoading] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);

  const setRememberMeCookie = (remember: boolean) => {
    document.cookie = `remember_me=${remember}; path=/; max-age=${remember ? 31536000 : 0}; SameSite=Lax`;
  };

  const autoConfirm = async (e: string) => { try { await fetch("/api/v1/auth/confirm", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: e }) }); } catch {} };

  const checkEmailExists = async (e: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/v1/auth/check-email?email=${encodeURIComponent(e)}`);
      const d = await res.json();
      return d.exists;
    } catch { return false; }
  };

  const tryLogin = async (e: string, p: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email: e, password: p });
    if (!error) return true;
    if (error.message?.toLowerCase().includes("email not confirmed")) { await autoConfirm(e); return !(await supabase.auth.signInWithPassword({ email: e, password: p })).error; }
    return false;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode !== "login") return;
    setLoading(true);
    try {
      const ok = await tryLogin(email, password);
      if (!ok) throw new Error("Invalid email or password. If you forgot your password, click 'Forgot password'.");
      setRememberMeCookie(rememberMe);
      await fetch("/api/v1/auth/sync", { method: "POST" });
      window.location.href = "/dashboard-app";
    } catch (err: any) { toast.error(err.message || "Something went wrong."); } finally { setLoading(false); }
  };

  const socialLogin = async (provider: "google") => {
    setLoading(true);
    try {
      setRememberMeCookie(rememberMe);
      await supabase.auth.signInWithOAuth({ provider, options: { redirectTo: `${window.location.origin}/auth/callback?next=/dashboard-app` } });
    } catch { toast.error(`${provider} login failed.`); setLoading(false); }
  };

  const handleProfileComplete = () => {
    window.location.href = "/dashboard-app";
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return toast.error("Enter your email.");
    setLoading(true);
    const exists = await checkEmailExists(email);
    if (!exists) { setLoading(false); return toast.error("This email is not registered. Please check your email or create a new account."); }
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/auth/callback?next=/reset-password` });
    setLoading(false);
    if (error) return toast.error(error.message);
    setForgotSent(true);
  };

  // ── Shared form elements ──────────────────────────────────

  const loginFields: AuthField[] = [
    { name: "email", label: "Email", type: "email", placeholder: "Email address", icon: "mail", autoComplete: "email", value: email, onChange: setEmail },
    { name: "password", label: "Password", type: "password", placeholder: "Password", icon: "lock", autoComplete: "current-password", value: password, onChange: setPassword },
  ];

  const tabs = (
    <div className="flex mb-6 p-0.5 rounded-xl bg-secondary border border-border">
      <button onClick={() => setMode("login")}
        className={`flex-1 py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-all ${mode === "login" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
        Sign In
      </button>
      <button onClick={() => setMode("register")}
        className={`flex-1 py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-all ${mode === "register" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
        Sign Up
      </button>
    </div>
  );

  const formContent = mode === "login" ? (
    <NewAuthForm
      fields={loginFields}
      submitLabel="Sign In"
      loading={loading}
      onSubmit={handleSubmit}
      onGoogle={() => socialLogin("google")}
      extra={
        <>
          <div className="flex justify-between items-center">
            <button type="button" onClick={() => setMode("forgot-password")} className="text-xs font-semibold text-muted-foreground hover:text-primary transition-colors">
              Forgot password?
            </button>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} className="w-3.5 h-3.5 rounded border-border bg-background accent-primary" />
            <span className="text-xs font-medium text-muted-foreground">Remember me</span>
          </label>
        </>
      }
    />
  ) : (
    <div className="space-y-4">
      <NewAuthForm
        fields={[]}
        submitLabel=""
        loading={loading}
        onSubmit={() => {}}
        onGoogle={() => socialLogin("google")}
      />
      <p className="text-center text-xs text-muted-foreground">By continuing, you agree to our Terms and Privacy Policy.</p>
    </div>
  );

  const authFooter = mode === "login" ? (
    <span>
      New here?{" "}
      <button onClick={() => setMode("register")} className="text-primary hover:underline">Create an account</button>
    </span>
  ) : (
    <span>
      Already registered?{" "}
      <button onClick={() => setMode("login")} className="text-primary hover:underline">Sign In</button>
    </span>
  );

  // ── Complete-Profile mode ──────────────────────────────────

  if (mode === "complete-profile") {
    return (
      <>
        {/* Desktop */}
        <div className="hidden min-[1440px]:block">
          <DesktopAuthLayout progressStep={2}>
            <ProfileCompletionForm onComplete={handleProfileComplete} />
          </DesktopAuthLayout>
        </div>
        {/* Mobile */}
        <div className="min-[1440px]:hidden">
          <NewAuthShell
            eyebrow="Setup"
            title="Complete Your Profile"
            subtitle="Set up your academic profile to get started."
            footer={null}
          >
            <ProfileCompletionForm onComplete={handleProfileComplete} />
          </NewAuthShell>
        </div>
      </>
    );
  }

  // ── Forgot-password mode ──────────────────────────────────

  if (mode === "forgot-password") {
    const forgotContent = !forgotSent ? (
      <form onSubmit={handleForgot} className="space-y-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-foreground/80">Email</label>
          <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="Registered email"
            className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm shadow-sm transition-all placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10" />
        </div>
        <button type="submit" disabled={loading}
          className="group mt-2 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-foreground px-5 text-sm font-semibold text-background shadow-[0_10px_30px_-10px_rgba(0,0,0,0.6)] transition-all hover:bg-foreground/90 disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send Reset Link"}
        </button>
      </form>
    ) : (
      <div className="text-center py-8 space-y-4">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-green-500/20 bg-green-500/10 text-green-500">
          <CheckCircle size={32} />
        </div>
        <p className="text-sm text-muted-foreground">Check your inbox for the reset link.</p>
      </div>
    );

    const forgotFooter = (
      <button onClick={() => { setMode("login"); setForgotSent(false); }} className="mx-auto flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft size={14} /> Back to Sign In
      </button>
    );

    return (
      <>
        {/* Desktop — simplified centered form */}
        <div className="hidden min-h-dvh items-center justify-center min-[1440px]:flex">
          <div className="w-full max-w-md">
            {forgotContent}
            <p className="mt-6 text-center text-sm text-muted-foreground">{forgotFooter}</p>
          </div>
        </div>
        {/* Mobile */}
        <div className="min-[1440px]:hidden">
          <NewAuthShell
            eyebrow="Password Reset"
            title={forgotSent ? "Email Sent" : "Reset Password"}
            subtitle={forgotSent ? "Check your inbox for the reset link." : ""}
            footer={forgotFooter}
          >
            {forgotContent}
          </NewAuthShell>
        </div>
      </>
    );
  }

  // ── Login / Register modes ────────────────────────────────

  return (
    <>
      {/* Desktop layout (≥1440px) */}
      <div className="hidden min-[1440px]:block">
        <DesktopAuthLayout progressStep={mode === "register" ? 1 : 0}>
          {tabs}
          {formContent}
          <p className="mt-6 text-center text-sm text-muted-foreground">{authFooter}</p>
        </DesktopAuthLayout>
      </div>

      {/* Mobile layout (<1440px) */}
      <div className="min-[1440px]:hidden">
        <NewAuthShell
          eyebrow={mode === "login" ? "Welcome Back" : "New Student"}
          title={mode === "login" ? "Sign In" : "Create Account"}
          subtitle={mode === "login" ? "Sign in to your medical workspace" : "Start your medical journey with MedOneX"}
          footer={authFooter}
        >
          {tabs}
          {formContent}
        </NewAuthShell>
      </div>
    </>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>}>
      <AuthContent />
    </Suspense>
  );
}
