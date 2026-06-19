"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import {
  Mail, Lock, User, Building2, GraduationCap, Calendar, BookOpen,
  ChevronRight, Loader2, CheckCircle, ShieldCheck, ArrowLeft, Send,
  Eye, EyeOff, Github, Chrome, Facebook
} from "lucide-react";
import { CaretUpDown } from "@phosphor-icons/react";
import { MedOneXLogoMark } from "@/components/branding/MedQsLogo";
import { MedicalCinematicBg } from "@/components/auth/MedicalCinematicBg";
import toast from "react-hot-toast";
import { unwrapApiList } from "@/lib/api-list";
import { cn } from "@/lib/utils";

const steps = [
  { num: "01", label: "Sign up your account" },
  { num: "02", label: "Set up your workspace" },
  { num: "03", label: "Set up your profile" },
];

function CustomDropdown({ label, options, value, onChange, icon: Icon, disabled, placeholder }: any) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const f = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false); };
    document.addEventListener("mousedown", f);
    return () => document.removeEventListener("mousedown", f);
  }, []);
  return (
    <div className="space-y-1 relative" ref={ref}>
      <label className="text-[9px] font-bold text-white/40 uppercase ml-1 tracking-widest">{label}</label>
      <button type="button" disabled={disabled} onClick={() => setIsOpen(!isOpen)}
        className={cn("w-full flex items-center justify-between gap-2 px-4 py-3.5 rounded-xl border transition-all bg-white/[0.02] border-white/[0.06]",
          isOpen ? "ring-1 ring-primary/30 border-primary/40" : "hover:bg-white/[0.05]", disabled && "opacity-40")}>
        <div className="flex items-center gap-2.5 overflow-hidden">
          <Icon className={cn("shrink-0", value ? "text-primary" : "text-white/20")} size={15} />
          <span className={cn("text-xs font-semibold truncate", value ? "text-white" : "text-white/20")}>
            {value ? (options.find((o: any) => o.id === value.id)?.name || value.name) : placeholder}
          </span>
        </div>
        <CaretUpDown className="text-white/20 shrink-0" size={12} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0, y: 8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.95 }}
            className="absolute z-[100] left-0 right-0 mt-1.5 p-1.5 bg-[#0d101f] border border-white/10 rounded-xl shadow-2xl backdrop-blur-md max-h-[200px] overflow-y-auto custom-scrollbar">
            {options.length === 0 ? (
              <div className="py-6 text-center text-[10px] text-white/40">No options found</div>
            ) : options.map((opt: any) => (
              <button key={opt.id} type="button" onClick={() => { onChange(opt); setIsOpen(false); }}
                className={cn("w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all text-left",
                  value?.id === opt.id ? "bg-primary text-white shadow-sm" : "text-white/60 hover:bg-white/5")}>
                {opt.name || `Year ${opt.yearNumber}`}
                {value?.id === opt.id && <CheckCircle size={14} className="ml-auto" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AuthContent() {
  const router = useRouter();
  const sp = useSearchParams();
  const supabase = createClient();

  type AuthMode = "login" | "register" | "forgot-password";
  const [mode, setMode] = useState<AuthMode>(["register", "onboarding"].includes(sp.get("mode") || "") ? "register" : "login");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const [unis, setUnis] = useState<any[]>([]);
  const [faculties, setFaculties] = useState<any[]>([]);
  const [years, setYears] = useState<any[]>([]);
  const [semesters, setSemesters] = useState<any[]>([]);
  const [selUni, setSelUni] = useState<any>(null);
  const [selFac, setSelFac] = useState<any>(null);
  const [selYear, setSelYear] = useState<any>(null);
  const [selSem, setSelSem] = useState<any>(null);

  useEffect(() => { fetch("/api/v1/universities").then(r => r.ok ? r.json() : { data: [] }).then(d => setUnis(unwrapApiList(d))).catch(() => {}); }, []);
  useEffect(() => { if (selUni) { setSelFac(null); setSelYear(null); setSelSem(null); setFaculties([]); setYears([]); setSemesters([]); fetch(`/api/v1/faculties?universityId=${selUni.id}`).then(r => r.json()).then(d => setFaculties(unwrapApiList(d))); } }, [selUni]);
  useEffect(() => { if (selFac) { setSelYear(null); setSelSem(null); setYears([]); setSemesters([]); fetch(`/api/v1/academic-years?universityId=${selUni?.id}&facultyId=${selFac.id}`).then(r => r.json()).then(d => setYears(unwrapApiList(d))); } }, [selFac, selUni]);
  useEffect(() => { if (selYear) { setSelSem(null); setSemesters([]); fetch(`/api/v1/semesters?academicYearId=${selYear.id}`).then(r => r.json()).then(d => setSemesters(unwrapApiList(d))); } }, [selYear]);

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
    setLoading(true);
    try {
      if (mode === "login") {
        const ok = await tryLogin(email, password);
        if (!ok) throw new Error("Invalid email or password. If you forgot your password, click 'Forgot password'.");
        await fetch("/api/v1/auth/sync", { method: "POST" });
        window.location.href = "/dashboard-app";
      } else {
        if (!selUni || !selSem || !password || !firstName || !lastName) throw new Error("Please complete all fields.");
        const exists = await checkEmailExists(email);
        if (exists) throw new Error("This email is already registered. Try signing in or use a different email.");
        const fullName = `${firstName} ${lastName}`;
        const { data, error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard-app`, data: { name: fullName, universityId: selUni.id, facultyId: selFac?.id, semesterId: selSem.id, onboarding_completed: true } }
        });
        if (error) throw error;
        await autoConfirm(email);
        if (data.session) { await fetch("/api/v1/auth/sync", { method: "POST" }); toast.success("Account created!"); window.location.href = "/dashboard-app"; }
        else { const r = await tryLogin(email, password); if (r) { await fetch("/api/v1/auth/sync", { method: "POST" }); toast.success("Account created!"); window.location.href = "/dashboard-app"; } else { toast.success("Account created! You can now sign in."); setMode("login"); } }
      }
    } catch (err: any) { toast.error(err.message || "Something went wrong."); } finally { setLoading(false); }
  };

  const socialLogin = async (provider: "google" | "facebook") => {
    setLoading(true);
    try { await supabase.auth.signInWithOAuth({ provider, options: { redirectTo: `${window.location.origin}/auth/callback?next=/auth%3Fmode%3Donboarding` } }); }
    catch { toast.error(`${provider} login failed.`); setLoading(false); }
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
        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-sm text-white/40 font-medium mb-12 max-w-md">
          Complete these easy steps to register your account.
        </motion.p>
        <div className="space-y-4">
          {steps.map((s, i) => (
            <motion.div key={s.num} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.1 }}
              className={cn("flex items-center gap-4 p-4 rounded-2xl transition-all duration-500", activeStep === i ? "bg-white/[0.06] border border-white/[0.08] shadow-lg backdrop-blur-sm" : "bg-white/[0.02] border border-transparent")}>
              <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold transition-all", activeStep === i ? "bg-primary text-white shadow-lg shadow-primary/30" : "bg-white/5 text-white/30")}>{s.num}</div>
              <span className={cn("text-sm font-semibold transition-all", activeStep === i ? "text-white" : "text-white/30")}>{s.label}</span>
            </motion.div>
          ))}
        </div>
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
              <motion.form key="register" initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -15 }} onSubmit={handleSubmit} className="space-y-4">
                <div className="text-center mb-4">
                  <h3 className="text-xl font-bold text-white">Sign Up Account</h3>
                  <p className="text-[11px] text-white/40 mt-1">Enter your personal data to create your account.</p>
                </div>

                {/* Social */}
                <div className="grid grid-cols-2 gap-3">
                  <button type="button" onClick={() => socialLogin("google")} disabled={loading} className="flex items-center justify-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-xs font-semibold text-white/70 hover:text-white hover:bg-white/[0.05] transition-all active:scale-[0.98]">
                    <Chrome size={16} /> Google
                  </button>
                  <button type="button" onClick={() => socialLogin("facebook")} disabled={loading} className="flex items-center justify-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-xs font-semibold text-white/70 hover:text-white hover:bg-white/[0.05] transition-all active:scale-[0.98]">
                    <Facebook size={16} /> Facebook
                  </button>
                </div>

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-white/[0.06]" /></div>
                  <div className="relative flex justify-center"><span className="bg-[#111] px-3 text-[9px] text-white/20 font-semibold uppercase tracking-widest">Or</span></div>
                </div>

                {/* Academic */}
                <div className="space-y-3 pb-1">
                  <CustomDropdown label="University" options={unis} value={selUni} onChange={(v: any) => { setSelUni(v); setActiveStep(1); }} icon={Building2} placeholder="Select University" />
                  {selUni && <CustomDropdown label="Faculty" options={faculties} value={selFac} onChange={setSelFac} icon={GraduationCap} placeholder="Select Faculty" />}
                  {selFac && <div className="grid grid-cols-2 gap-3">
                    <CustomDropdown label="Year" options={years} value={selYear} onChange={setSelYear} icon={Calendar} placeholder="Year" />
                    <CustomDropdown label="Semester" options={semesters} value={selSem} onChange={(v: any) => { setSelSem(v); setActiveStep(2); }} icon={BookOpen} placeholder="Sem" />
                  </div>}
                </div>

                {/* Personal */}
                {selSem && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3 pt-1 border-t border-white/[0.06]">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/20" size={15} />
                        <input type="text" required value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="First Name"
                          className="w-full bg-white/[0.02] border border-white/[0.07] rounded-xl py-3 pl-9 pr-3 text-xs font-semibold text-white placeholder:text-white/20 outline-none transition-all focus:border-primary/40 focus:ring-1 focus:ring-primary/20" />
                      </div>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/20" size={15} />
                        <input type="text" required value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Last Name"
                          className="w-full bg-white/[0.02] border border-white/[0.07] rounded-xl py-3 pl-9 pr-3 text-xs font-semibold text-white placeholder:text-white/20 outline-none transition-all focus:border-primary/40 focus:ring-1 focus:ring-primary/20" />
                      </div>
                    </div>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/20" size={15} />
                      <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="Email"
                        className="w-full bg-white/[0.02] border border-white/[0.07] rounded-xl py-3 pl-9 pr-3 text-xs font-semibold text-white placeholder:text-white/20 outline-none transition-all focus:border-primary/40 focus:ring-1 focus:ring-primary/20" />
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/20" size={15} />
                      <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="Password"
                        className="w-full bg-white/[0.02] border border-white/[0.07] rounded-xl py-3 pl-9 pr-3 text-xs font-semibold text-white placeholder:text-white/20 outline-none transition-all focus:border-primary/40 focus:ring-1 focus:ring-primary/20" />
                    </div>
                  </motion.div>
                )}

                <button type="submit" disabled={loading || !selSem}
                  className="w-full py-3.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-bold tracking-widest uppercase shadow-lg shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign Up"}
                </button>
              </motion.form>
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
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.06); border-radius: 20px; }
      `}</style>
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
