"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import {
  Mail, Lock, Loader2, CheckCircle, ArrowLeft, Send,
  Eye, EyeOff, Chrome, Facebook
} from "lucide-react";
import { MedOneXLogoMark } from "@/components/branding/MedQsLogo";
import { MedicalCinematicBg } from "@/components/auth/MedicalCinematicBg";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

function AuthContent() {
  const sp = useSearchParams();
  const supabase = createClient();

  type AuthMode = "login" | "register" | "forgot-password";
  const [mode, setMode] = useState<AuthMode>(["register", "onboarding"].includes(sp.get("mode") || "") ? "register" : "login");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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

  const socialLogin = async (provider: "google" | "facebook") => {
    setLoading(true);
    try {
      setRememberMeCookie(rememberMe);
      await supabase.auth.signInWithOAuth({ provider, options: { redirectTo: `${window.location.origin}/auth/callback?next=/dashboard-app` } });
    } catch { toast.error(`${provider} login failed.`); setLoading(false); }
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

  /* ── LEFT PANEL (desktop) ── */
  const leftPanel = (
    <div className="relative hidden lg:flex w-[55%] min-h-screen flex-col justify-between p-12 overflow-hidden">
      <div className="relative z-10">
        <MedOneXLogoMark className="h-8 w-8 text-white" />
      </div>
      <div className="relative z-10 mb-20">
        <motion.h2 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-4xl font-bold tracking-tight text-white mb-3">
          Get Started with Us
        </motion.h2>
        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-sm text-white/40 font-medium max-w-md">
          Your gateway to medical education excellence.
        </motion.p>
      </div>
      <div className="relative z-10 text-[11px] text-white/20 font-medium">MedOneX 2026 — Medical Education Platform</div>
    </div>
  );

  /* ── RIGHT PANEL ── */
  const rightPanel = (
    <div className="relative flex-1 min-h-screen flex items-center justify-center p-4 lg:p-8">
      {/* Mobile Hero */}
      <div className="lg:hidden absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#050505]/60 to-[#050505]" />
        <div className="relative z-10 p-6 pt-12 pb-16 text-center">
          <MedOneXLogoMark className="h-8 w-8 mx-auto mb-4 text-white" />
          <h2 className="text-xl font-bold text-white mb-1">Get Started</h2>
          <p className="text-[11px] text-white/40 font-medium">Complete your registration</p>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="relative z-20 w-full max-w-[420px]">
        {/* Form Card */}
        <div className="bg-[#111111]/20 backdrop-blur-3xl backdrop-saturate-150 border border-white/[0.05] rounded-3xl p-6 sm:p-8 shadow-[0_8px_40px_rgba(0,0,0,0.5)] before:absolute before:inset-0 before:rounded-3xl before:bg-gradient-to-b before:from-white/[0.08] before:to-transparent before:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-gradient-to-r after:from-transparent after:via-white/[0.08] after:to-transparent after:pointer-events-none relative overflow-hidden">
          {/* Tabs */}
          <div className="flex mb-6 p-0.5 rounded-xl bg-white/[0.04] border border-white/[0.05]">
            <button onClick={() => setMode("login")} className={cn("flex-1 py-2.5 text-[10px] font-bold uppercase tracking-widest rounded-[10px] transition-all", mode === "login" ? "bg-white/10 text-white shadow-sm" : "text-white/30 hover:text-white/60")}>Sign In</button>
            <button onClick={() => setMode("register")} className={cn("flex-1 py-2.5 text-[10px] font-bold uppercase tracking-widest rounded-[10px] transition-all", mode === "register" ? "bg-white/10 text-white shadow-sm" : "text-white/30 hover:text-white/60")}>Sign Up</button>
          </div>

          <AnimatePresence mode="wait">
            {/* ── LOGIN ── */}
            {mode === "login" && !forgotSent && (
              <motion.form key="login" initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 15 }} onSubmit={handleSubmit} className="space-y-4">
                <div className="text-center mb-5">
                  <h3 className="text-xl font-bold text-white">Welcome Back</h3>
                  <p className="text-[11px] text-white/40 mt-1">Sign in to your medical workspace</p>
                </div>
                <div className="space-y-3.5">
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                    <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="Email address"
                      className="w-full bg-white/[0.02] border border-white/[0.07] rounded-xl py-3.5 pl-10 pr-4 text-sm font-medium text-white placeholder:text-white/20 outline-none transition-all focus:border-primary/40 focus:ring-1 focus:ring-primary/20" />
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                    <input type={showPassword ? "text" : "password"} required value={password} onChange={e => setPassword(e.target.value)} placeholder="Password"
                      className="w-full bg-white/[0.02] border border-white/[0.07] rounded-xl py-3.5 pl-10 pr-10 text-sm font-medium text-white placeholder:text-white/20 outline-none transition-all focus:border-primary/40 focus:ring-1 focus:ring-primary/20" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/60">
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <button type="button" onClick={() => setMode("forgot-password")} className="text-[10px] font-semibold text-white/30 hover:text-primary transition-colors">Forgot password?</button>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} className="w-3.5 h-3.5 rounded border-white/20 bg-white/5 accent-primary" />
                  <span className="text-[10px] font-medium text-white/40">Remember me</span>
                </label>
                <button type="submit" disabled={loading} className="w-full py-3.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-bold tracking-widest uppercase shadow-lg shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign In"}
                </button>
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-white/[0.06]" /></div>
                  <div className="relative flex justify-center"><span className="bg-[#111] px-3 text-[9px] text-white/20 font-semibold uppercase tracking-widest">Or continue with</span></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button type="button" onClick={() => socialLogin("google")} disabled={loading} className="flex items-center justify-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-xs font-semibold text-white/70 hover:text-white hover:bg-white/[0.05] transition-all active:scale-[0.98]">
                    <Chrome size={16} /> Google
                  </button>
                  <button type="button" onClick={() => socialLogin("facebook")} disabled={loading} className="flex items-center justify-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-xs font-semibold text-white/70 hover:text-white hover:bg-white/[0.05] transition-all active:scale-[0.98]">
                    <Facebook size={16} /> Facebook
                  </button>
                </div>
              </motion.form>
            )}

            {/* ── REGISTER ── */}
            {mode === "register" && (
              <motion.div key="register" initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -15 }} className="space-y-4">
                <div className="text-center mb-4">
                  <h3 className="text-xl font-bold text-white">Create Account</h3>
                  <p className="text-[11px] text-white/40 mt-1">Start your medical journey with MedOneX</p>
                </div>
                <button type="button" onClick={() => socialLogin("google")} disabled={loading}
                  className="w-full flex items-center justify-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3.5 text-sm font-semibold text-white/70 hover:text-white hover:bg-white/[0.05] transition-all active:scale-[0.98] disabled:opacity-50">
                  <Chrome size={20} /> Continue with Google
                </button>
                <p className="text-center text-[10px] text-white/20 mt-4">By continuing, you agree to our Terms and Privacy Policy.</p>
              </motion.div>
            )}

            {/* ── FORGOT PASSWORD ── */}
            {mode === "forgot-password" && (
              <motion.div key="forgot" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-5">
                <button onClick={() => { setMode("login"); setForgotSent(false); }} className="flex items-center gap-2 text-[10px] font-semibold text-white/30 hover:text-white transition-colors mb-3">
                  <ArrowLeft size={14} /> Back to Sign In
                </button>
                {!forgotSent ? (
                  <form onSubmit={handleForgot} className="space-y-4">
                    <h3 className="text-lg font-bold text-white">Reset Password</h3>
                    <p className="text-[11px] text-white/40">Enter your email to receive a reset link.</p>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                      <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="Registered email"
                        className="w-full bg-white/[0.02] border border-white/[0.07] rounded-xl py-3.5 pl-10 pr-4 text-sm font-medium text-white placeholder:text-white/20 outline-none transition-all focus:border-primary/40 focus:ring-1 focus:ring-primary/20" />
                    </div>
                    <button type="submit" disabled={loading} className="w-full py-3.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-bold tracking-widest uppercase shadow-lg shadow-primary/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2">
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send size={14} /> Send Reset Link</>}
                    </button>
                  </form>
                ) : (
                  <div className="text-center py-8 space-y-4">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-green-500/10 flex items-center justify-center text-green-500 border border-green-500/20 shadow-lg shadow-green-500/10">
                      <CheckCircle size={32} />
                    </div>
                    <h3 className="text-base font-bold text-white">Email Sent</h3>
                    <p className="text-[11px] text-white/40">Check your inbox for the reset link.</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <p className="text-center mt-5 text-[10px] text-white/20 font-medium">
          Protected by end-to-end encryption. Your data is secure.
        </p>
      </motion.div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#050505] selection:bg-primary/20 relative overflow-hidden">
      <MedicalCinematicBg />
      {leftPanel}
      {rightPanel}
      
    </div>
  );
}

export default function CinematicAuthPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#050505] flex items-center justify-center relative"><MedicalCinematicBg /><Loader2 className="h-6 w-6 animate-spin text-primary z-10" /></div>}>
      <AuthContent />
    </Suspense>
  );
}
