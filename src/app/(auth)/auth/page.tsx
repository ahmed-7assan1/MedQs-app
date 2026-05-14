"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { GoogleOAuthProvider, useGoogleOneTapLogin } from "@react-oauth/google";
import { 
  EnvelopeSimple, LockKey, User, Phone, 
  Buildings, GraduationCap, Calendar, BookOpen, 
  CaretRight, CaretLeft, CircleNotch, CheckCircle, 
  ShieldCheck, Brain, ArrowLeft, PaperPlaneTilt, MagicWand
} from "@phosphor-icons/react";
import { MedOneXLogoMark } from "@/components/branding/MedQsLogo";
import { CinematicBackground } from "@/components/landing/CinematicBackground";
import toast from "react-hot-toast";
import { unwrapApiList } from "@/lib/api-list";
import { cn } from "@/lib/utils";

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  
  // Fix TypeScript error by including all possible modes
  type AuthMode = "login" | "register" | "onboarding" | "forgot-password";
  const initialMode = (searchParams.get("mode") as AuthMode) || "login";
  
  const isOnboarding = initialMode === "onboarding";
  const [activeTab, setActiveTab] = useState<"login" | "register">(
    isOnboarding ? "register" : (initialMode === "register" ? "register" : "login")
  );
  
  const [loading, setLoading] = useState(false);
  const [magicLinkLoading, setMagicLinkLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(initialMode === "forgot-password");
  const [forgotSent, setForgotSent] = useState(false);

  // Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  // Academic State
  const [universities, setUniversities] = useState<any[]>([]);
  const [faculties, setFaculties] = useState<any[]>([]);
  const [years, setYears] = useState<any[]>([]);
  const [semesters, setSemesters] = useState<any[]>([]);
  
  const [selectedUni, setSelectedUni] = useState<any>(null);
  const [selectedFaculty, setSelectedFaculty] = useState<any>(null);
  const [hasFaculties, setHasFaculties] = useState<boolean | null>(null);
  const [selectedYear, setSelectedYear] = useState<any>(null);
  const [selectedSem, setSelectedSem] = useState<any>(null);

  // Initial Data Fetch
  useEffect(() => {
    fetch("/api/v1/universities").then(r => r.json()).then(d => {
      setUniversities(unwrapApiList(d));
    });
  }, []);

  useEffect(() => {
    if (selectedUni) {
      setHasFaculties(null);
      setFaculties([]);
      setYears([]);
      setSelectedFaculty(null);
      setSelectedYear(null);
      setSelectedSem(null);
      
      Promise.all([
        fetch(`/api/v1/faculties?universityId=${selectedUni.id}`).then(r => r.json()),
        fetch(`/api/v1/academic-years?universityId=${selectedUni.id}`).then(r => r.json())
      ]).then(([facData, yearData]) => {
        const facList = unwrapApiList<any>(facData);
        const yearList = unwrapApiList<any>(yearData);
        
        setFaculties(facList);
        setHasFaculties(facList.length > 0);
        setYears(yearList);
      }).catch(err => {
        console.error("Error fetching uni data:", err);
        setHasFaculties(false);
      });
    }
  }, [selectedUni]);

  useEffect(() => {
    if (selectedYear) {
      fetch(`/api/v1/semesters?academicYearId=${selectedYear.id}`).then(r => r.json()).then(d => {
        setSemesters(unwrapApiList(d));
      });
    } else {
      setSemesters([]);
    }
  }, [selectedYear]);

  const saveProfileData = async () => {
    const res = await fetch("/api/v1/auth/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        universityId: selectedUni?.id,
        ...(selectedFaculty ? { facultyId: selectedFaculty.id } : {}),
        semesterId: selectedSem?.id,
        nickname: name || email.split("@")[0],
        phone: phone || undefined,
      }),
    });
    if (!res.ok) throw new Error("Failed to save academic profile");
  };

  const handleMagicLink = async () => {
    if (!email) return toast.error("Please enter your email first.");
    setMagicLinkLoading(true);
    
    try {
      // Check if email exists first (Security requirement)
      const res = await fetch(`/api/v1/auth/check-email?email=${encodeURIComponent(email)}`);
      const { exists } = await res.json();
      
      if (!exists) {
        toast.error("This email is not registered. Please create an account first.");
        setMagicLinkLoading(false);
        return;
      }

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      
      if (error) throw error;
      toast.success("Magic Link sent! Check your inbox.");
    } catch (err: any) {
      toast.error(err.message || "Failed to send magic link.");
    } finally {
      setMagicLinkLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return toast.error("Please enter your email address.");
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    setForgotSent(true);
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || (activeTab === "login" && !password)) return toast.error("Please fill in all fields.");
    setLoading(true);

    try {
      if (activeTab === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back!");
        router.push("/dashboard");
      } else {
        if (!selectedUni || !selectedSem || !password) return toast.error("Please complete all academic and account info.");
        
        const { data, error } = await supabase.auth.signUp({
          email, password,
          options: { data: { name, phone } }
        });
        if (error) throw error;
        
        await saveProfileData();
        
        if (data.session) {
          toast.success("Account created successfully!");
          router.push("/dashboard");
        } else {
          toast.success("Account created! Check your email to verify.");
          setActiveTab("login");
        }
      }
    } catch (err: any) {
      toast.error(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleClick = () => {
    const btn = document.querySelector('[role="button"][aria-labelledby="button-label"]') as HTMLElement;
    if(btn) btn.click();
  };

  // Google One Tap Hook
  useGoogleOneTapLogin({
    onSuccess: async (credentialResponse) => {
      setLoading(true);
      try {
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: credentialResponse.credential!,
        });
        if (error) throw error;

        if (activeTab === "register" || isOnboarding) {
          await saveProfileData();
        }
        
        toast.success(`Welcome to MedOneX!`);
        router.push("/dashboard");
      } catch (err: any) {
        toast.error(err.message || "Google authentication failed");
        setLoading(false);
      }
    },
    onError: () => console.log("Google One Tap Error"),
    cancel_on_tap_outside: false,
  });

  return (
    <div className="relative z-10 w-full max-w-[480px] flex flex-col items-center px-4 pt-12 pb-24 mx-auto">
      
      {/* Brand Header */}
      <div className="mb-8 flex flex-col items-center text-center">
        <div className="p-4 rounded-[24px] bg-white/40 dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-xl backdrop-blur-xl mb-4">
          <MedOneXLogoMark className="h-10 w-10 text-slate-900 dark:text-white" />
        </div>
        <h1 className="text-2xl font-display font-black tracking-tight text-slate-900 dark:text-white">
          {isOnboarding ? "Complete Your Profile" : (showForgot ? "Reset Password" : "MedOneX Ecosystem")}
        </h1>
        <p className="text-xs text-slate-500 dark:text-white/50 mt-1 font-medium">
          Professional Medical Education Reimagined.
        </p>
      </div>

      <div className="w-full bg-white/60 dark:bg-[#05070f]/60 backdrop-blur-3xl border border-slate-200 dark:border-white/10 rounded-[32px] p-2 shadow-2xl overflow-hidden">
        
        {/* Tabs */}
        {!isOnboarding && !showForgot && (
          <div className="relative flex p-1 mb-4 bg-slate-200/50 dark:bg-white/5 rounded-[24px]">
            <div className={cn("absolute inset-y-1 w-[calc(50%-4px)] bg-white dark:bg-blue-600 rounded-[20px] shadow-sm transition-all duration-300 ease-out", activeTab === "register" ? "left-[calc(50%)]" : "left-1")} />
            <button onClick={() => { setActiveTab("login"); }} className={cn("relative z-10 flex-1 py-3 text-sm font-bold transition-colors", activeTab === "login" ? "text-slate-900 dark:text-white" : "text-slate-500 dark:text-white/40")}>
              Sign In
            </button>
            <button onClick={() => setActiveTab("register")} className={cn("relative z-10 flex-1 py-3 text-sm font-bold transition-colors", activeTab === "register" ? "text-slate-900 dark:text-white" : "text-slate-500 dark:text-white/40")}>
              Register
            </button>
          </div>
        )}

        <div className="p-4 sm:p-5 max-h-[70vh] overflow-y-auto custom-scrollbar">
          <AnimatePresence mode="wait">
            
            {/* LOGIN FLOW */}
            {activeTab === "login" && !showForgot && (
              <motion.form key="login" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} onSubmit={handleEmailAuth} className="space-y-4">
                <div className="space-y-3">
                  <div className="relative group">
                    <EnvelopeSimple className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/20 group-focus-within:text-blue-500 transition-colors" size={18} />
                    <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="Email Address" 
                      className="w-full bg-slate-100/50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.05] rounded-xl py-3.5 pl-11 pr-4 text-sm text-slate-900 dark:text-white focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all" />
                  </div>
                  <div className="relative group">
                    <LockKey className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/20 group-focus-within:text-blue-500 transition-colors" size={18} />
                    <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" 
                      className="w-full bg-slate-100/50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.05] rounded-xl py-3.5 pl-11 pr-4 text-sm text-slate-900 dark:text-white focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all" />
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <button type="button" onClick={handleMagicLink} disabled={magicLinkLoading} className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                    {magicLinkLoading ? <CircleNotch className="animate-spin" /> : <MagicWand weight="fill" />} 
                    Magic Link
                  </button>
                  <button type="button" onClick={() => setShowForgot(true)} className="text-[11px] font-bold text-slate-500 dark:text-white/40 hover:text-blue-600 transition-colors">Forgot Password?</button>
                </div>

                <button type="submit" disabled={loading} className="w-full py-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center">
                  {loading ? <CircleNotch className="animate-spin" /> : "Enter Workspace"}
                </button>

                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200 dark:border-white/10"></div></div>
                  <div className="relative flex justify-center text-[10px] uppercase font-black"><span className="bg-transparent px-2 text-slate-400 dark:text-white/30">Or Continue With</span></div>
                </div>

                <button type="button" onClick={handleGoogleClick} className="w-full py-3.5 rounded-xl border border-slate-200 dark:border-white/10 flex items-center justify-center gap-3 hover:bg-slate-50 dark:hover:bg-white/5 transition-all font-bold text-xs">
                  <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.83c.87-2.6 3.3-4.52 6.16-4.52z"/></svg>
                  Google Account
                </button>
              </motion.form>
            )}

            {/* UNIFIED REGISTER FLOW */}
            {activeTab === "register" && !showForgot && (
              <motion.form key="register" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} onSubmit={handleEmailAuth} className="space-y-6">
                
                {/* 1. Academic Selection Section */}
                <div className="space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-widest text-blue-500 flex items-center gap-2">
                    <Buildings size={16} /> 1. Academic Information
                  </h3>
                  
                  <div className="grid gap-3">
                    {/* University Select */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">University</label>
                      <select 
                        value={selectedUni?.id || ""} 
                        onChange={(e) => setSelectedUni(universities.find(u => u.id === e.target.value))}
                        className="w-full bg-slate-100/50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.05] rounded-xl py-3 px-3 text-sm text-slate-900 dark:text-white focus:border-blue-500/50 outline-none appearance-none"
                      >
                        <option value="" className="dark:bg-slate-900">Select University</option>
                        {universities.map(uni => <option key={uni.id} value={uni.id} className="dark:bg-slate-900">{uni.name}</option>)}
                      </select>
                    </div>

                    {/* Faculty Select (Conditional) */}
                    {hasFaculties && (
                      <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Faculty</label>
                        <select 
                          value={selectedFaculty?.id || ""} 
                          onChange={(e) => setSelectedFaculty(faculties.find(f => f.id === e.target.value))}
                          className="w-full bg-slate-100/50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.05] rounded-xl py-3 px-3 text-sm text-slate-900 dark:text-white focus:border-blue-500/50 outline-none appearance-none"
                        >
                          <option value="" className="dark:bg-slate-900">Select Faculty</option>
                          {faculties.map(f => <option key={f.id} value={f.id} className="dark:bg-slate-900">{f.name}</option>)}
                        </select>
                      </div>
                    )}

                    {/* Year & Semester Row */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Academic Year</label>
                        <select 
                          disabled={!selectedUni}
                          value={selectedYear?.id || ""} 
                          onChange={(e) => setSelectedYear(years.find(y => y.id === e.target.value))}
                          className="w-full bg-slate-100/50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.05] rounded-xl py-3 px-3 text-sm text-slate-900 dark:text-white focus:border-blue-500/50 outline-none appearance-none disabled:opacity-50"
                        >
                          <option value="" className="dark:bg-slate-900">Year</option>
                          {years.map(y => <option key={y.id} value={y.id} className="dark:bg-slate-900">Year {y.yearNumber}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Semester</label>
                        <select 
                          disabled={!selectedYear}
                          value={selectedSem?.id || ""} 
                          onChange={(e) => setSelectedSem(semesters.find(s => s.id === e.target.value))}
                          className="w-full bg-slate-100/50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.05] rounded-xl py-3 px-3 text-sm text-slate-900 dark:text-white focus:border-blue-500/50 outline-none appearance-none disabled:opacity-50"
                        >
                          <option value="" className="dark:bg-slate-900">Semester</option>
                          {semesters.map(s => <option key={s.id} value={s.id} className="dark:bg-slate-900">{s.name}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Account Information Section */}
                <div className="space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-widest text-blue-500 flex items-center gap-2">
                    <User size={16} /> 2. Personal Credentials
                  </h3>
                  
                  <div className="grid gap-3">
                    <div className="relative group">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/20" size={18} />
                      <input type="text" required value={name} onChange={e => setName(e.target.value)} placeholder="Full Legal Name" 
                        className="w-full bg-slate-100/50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.05] rounded-xl py-3 pl-11 pr-4 text-sm text-slate-900 dark:text-white focus:border-blue-500/50 outline-none transition-all" />
                    </div>
                    <div className="relative group">
                      <EnvelopeSimple className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/20" size={18} />
                      <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="Academic Email" 
                        className="w-full bg-slate-100/50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.05] rounded-xl py-3 pl-11 pr-4 text-sm text-slate-900 dark:text-white focus:border-blue-500/50 outline-none transition-all" />
                    </div>
                    <div className="relative group">
                      <LockKey className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/20" size={18} />
                      <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="Create Secure Password" 
                        className="w-full bg-slate-100/50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.05] rounded-xl py-3 pl-11 pr-4 text-sm text-slate-900 dark:text-white focus:border-blue-500/50 outline-none transition-all" />
                    </div>
                  </div>
                </div>

                <button type="submit" disabled={loading} className="w-full py-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2">
                  {loading ? <CircleNotch className="animate-spin" /> : <><ShieldCheck weight="fill" /> Finalize Registration</>}
                </button>

                <p className="text-[10px] text-center text-slate-500 dark:text-white/30 px-4">
                  By registering, you agree to the MedOneX Professional Guidelines and Terms of Service.
                </p>
              </motion.form>
            )}

            {/* FORGOT PASSWORD FLOW */}
            {showForgot && (
              <motion.div key="forgot" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                {!forgotSent ? (
                  <>
                    <div className="flex items-center gap-3 mb-2">
                      <button onClick={() => setShowForgot(false)} className="p-2 bg-slate-100 dark:bg-white/[0.05] hover:bg-slate-200 dark:hover:bg-white/10 rounded-xl text-slate-500 dark:text-white/60 transition-colors">
                        <ArrowLeft size={16}/>
                      </button>
                      <div>
                        <h3 className="text-slate-900 dark:text-white font-bold text-sm">Reset Your Key</h3>
                        <p className="text-[10px] text-slate-500 dark:text-white/40">Secure verification required</p>
                      </div>
                    </div>
                    <form onSubmit={handleForgotPassword} className="space-y-4">
                      <div className="relative group">
                        <EnvelopeSimple className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/20" size={18} />
                        <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="Recovery Email"
                          className="w-full bg-slate-100/50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.05] rounded-xl py-3.5 pl-11 pr-4 text-sm text-slate-900 dark:text-white focus:border-blue-500/50 outline-none transition-all" />
                      </div>
                      <button type="submit" disabled={loading} className="w-full py-4 rounded-xl bg-blue-600 text-white font-bold text-sm shadow-lg flex items-center justify-center gap-2">
                        {loading ? <CircleNotch className="animate-spin" /> : <><PaperPlaneTilt weight="fill"/> Dispatch Link</>}
                      </button>
                    </form>
                  </>
                ) : (
                  <div className="text-center py-6 space-y-4">
                    <div className="w-16 h-16 mx-auto rounded-full bg-green-500/10 flex items-center justify-center text-green-500"><CheckCircle size={32} weight="fill" /></div>
                    <h3 className="font-bold text-white">Transmission Successful</h3>
                    <p className="text-xs text-white/50">Check your inbox for recovery instructions.</p>
                    <button onClick={() => setShowForgot(false)} className="text-xs font-bold text-blue-400 hover:underline">Back to Entrance</button>
                  </div>
                )}
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(148, 163, 184, 0.2); border-radius: 10px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.05); }
      `}</style>
    </div>
  );
}

export default function UnifiedAuthPage() {
  return (
    <div className="relative min-h-screen flex flex-col bg-slate-50 dark:bg-[#05070f] selection:bg-blue-500/30">
      <CinematicBackground />
      <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ""}>
        <Suspense fallback={<div className="flex-1 flex items-center justify-center"><CircleNotch className="animate-spin text-blue-500" size={32} /></div>}>
          <AuthContent />
        </Suspense>
      </GoogleOAuthProvider>
    </div>
  );
}
