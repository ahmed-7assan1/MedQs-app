"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { 
  EnvelopeSimple, LockKey, User, Phone, 
  Buildings, GraduationCap, Calendar, BookOpen, 
  CaretRight, CaretDown, CircleNotch, CheckCircle, 
  ShieldCheck, ArrowLeft, PaperPlaneTilt, MagicWand,
  CaretUpDown
} from "@phosphor-icons/react";
import { MedOneXLogoMark } from "@/components/branding/MedQsLogo";
import { CinematicBackground } from "@/components/landing/CinematicBackground";
import toast from "react-hot-toast";
import { unwrapApiList } from "@/lib/api-list";
import { cn } from "@/lib/utils";

// --- Custom Professional Dropdown Component ---
function CustomDropdown({ label, options, value, onChange, icon: Icon, disabled, placeholder }: any) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="space-y-1.5 relative" ref={dropdownRef}>
      <label className="text-[10px] font-black text-slate-500 dark:text-white/30 uppercase ml-1 tracking-widest">{label}</label>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between gap-3 px-6 py-4.5 rounded-2xl border transition-all duration-300",
          "bg-slate-100/50 dark:bg-white/[0.03] border-slate-200 dark:border-white/[0.05]",
          isOpen ? "ring-2 ring-blue-500/20 border-blue-500/50" : "hover:bg-slate-200/50 dark:hover:bg-white/[0.06]",
          disabled && "opacity-40 cursor-not-allowed filter grayscale"
        )}
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <Icon className={cn("shrink-0", value ? "text-blue-500" : "text-slate-400 dark:text-white/20")} size={18} />
          <span className={cn("text-sm font-bold truncate", value ? "text-slate-900 dark:text-white" : "text-slate-400 dark:text-white/20")}>
            {value ? (options.find((o: any) => o.id === value.id)?.name || value.name || `Year ${value.yearNumber}`) : placeholder}
          </span>
        </div>
        <CaretUpDown className="text-slate-400 dark:text-white/20 shrink-0" size={14} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute z-[100] left-0 right-0 mt-2 p-2 bg-white dark:bg-[#0d101f] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl backdrop-blur-2xl max-h-[240px] overflow-y-auto custom-scrollbar"
          >
            {options.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">No options found</div>
            ) : (
              options.map((opt: any) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    onChange(opt);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-bold transition-all text-left",
                    value?.id === opt.id 
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" 
                      : "text-slate-700 dark:text-white/70 hover:bg-slate-100 dark:hover:bg-white/5"
                  )}
                >
                  {opt.name || `Year ${opt.yearNumber}`}
                  {value?.id === opt.id && <CheckCircle size={16} weight="fill" className="ml-auto" />}
                </button>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Main Auth Content ---
function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  
  type AuthMode = "login" | "register" | "onboarding" | "forgot-password";
  
  useEffect(() => {
    // 1. URL Mode check
    const mode = searchParams.get("mode");
    if (mode === "register" || mode === "onboarding") setActiveTab("register");
    else setActiveTab("login");
  }, [searchParams]);

  const initialMode = (searchParams.get("mode") as AuthMode) || "login";
  
  const isOnboarding = initialMode === "onboarding";
  const [activeTab, setActiveTab] = useState<"login" | "register">(
    isOnboarding ? "register" : (initialMode === "register" ? "register" : "login")
  );
  
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(initialMode === "forgot-password");
  const [forgotSent, setForgotSent] = useState(false);
  const [emailNotConfirmed, setEmailNotConfirmed] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendEmail, setResendEmail] = useState("");

  // Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  // Academic Data State
  const [universities, setUniversities] = useState<any[]>([]);
  const [faculties, setFaculties] = useState<any[]>([]);
  const [years, setYears] = useState<any[]>([]);
  const [semesters, setSemesters] = useState<any[]>([]);
  
  // Selection State
  const [selectedUni, setSelectedUni] = useState<any>(null);
  const [selectedFaculty, setSelectedFaculty] = useState<any>(null);
  const [selectedYear, setSelectedYear] = useState<any>(null);
  const [selectedSem, setSelectedSem] = useState<any>(null);

  // Initial Universities Fetch
  useEffect(() => {
    fetch("/api/v1/universities")
      .then(r => r.ok ? r.json() : { data: [] })
      .then(d => setUniversities(unwrapApiList(d)))
      .catch(err => console.error("Failed to fetch universities:", err));
  }, []);

  // Cascade Logic: University -> Faculties
  useEffect(() => {
    if (selectedUni) {
      setSelectedFaculty(null); setSelectedYear(null); setSelectedSem(null);
      setFaculties([]); setYears([]); setSemesters([]);
      
      fetch(`/api/v1/faculties?universityId=${selectedUni.id}`)
        .then(r => r.json())
        .then(d => setFaculties(unwrapApiList(d)));
    }
  }, [selectedUni]);

  // Cascade Logic: Faculty -> Years
  useEffect(() => {
    if (selectedFaculty) {
      setSelectedYear(null); setSelectedSem(null);
      setYears([]); setSemesters([]);
      
      fetch(`/api/v1/academic-years?universityId=${selectedUni?.id}&facultyId=${selectedFaculty.id}`)
        .then(r => r.json())
        .then(d => setYears(unwrapApiList(d)));
    }
  }, [selectedFaculty, selectedUni]);

  // Cascade Logic: Year -> Semesters
  useEffect(() => {
    if (selectedYear) {
      setSelectedSem(null);
      setSemesters([]);
      
      fetch(`/api/v1/semesters?academicYearId=${selectedYear.id}`)
        .then(r => r.json())
        .then(d => setSemesters(unwrapApiList(d)));
    }
  }, [selectedYear]);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return toast.error("Please enter your email address.");
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    setForgotSent(true);
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (activeTab === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          if (error.message.toLowerCase().includes("email not confirmed")) {
            setResendEmail(email);
            setEmailNotConfirmed(true);
            setLoading(false);
            return;
          }
          throw error;
        }
        
        // Sync user to Prisma immediately after login
        await fetch("/api/v1/auth/sync", { method: "POST" });
        
        toast.success("Identity Verified. Access Granted.");
        window.location.href = "/dashboard-app";
      } else {
        if (!selectedUni || !selectedSem || !password || !name) {
          throw new Error("Please finalize all academic and account details.");
        }
        
        // Pass academic data to metadata so it's saved even without an immediate session
        const { data, error } = await supabase.auth.signUp({
          email, password,
          options: { 
            emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard-app`,
            data: { 
              name,
              universityId: selectedUni.id,
              facultyId: selectedFaculty?.id,
              semesterId: selectedSem.id,
              onboarding_completed: true
            } 
          }
        });
        
        if (error) throw error;
        
        if (data.session) {
          await fetch("/api/v1/auth/sync", { method: "POST" });
          toast.success("Professional Profile Established.");
          window.location.href = "/dashboard-app";
        } else {
          toast.success("Account created! Please verify your email to continue.");
          setActiveTab("login");
        }
      }
    } catch (err: any) {
      toast.error(err.message || "Protocol Failure. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    setResendLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: resendEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard-app`,
        },
      });
      if (error) throw error;
      toast.success("Confirmation email sent! Please check your inbox.");
    } catch (err: any) {
      toast.error(err.message || "Failed to resend confirmation email.");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="relative z-10 w-full max-w-[500px] flex flex-col items-center px-4 pt-10 pb-20 mx-auto">
      
      {/* Brand Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-10 flex flex-col items-center text-center">
        <div className="p-4 rounded-[28px] bg-white/40 dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-2xl backdrop-blur-2xl mb-6">
          <MedOneXLogoMark className="h-12 w-12 text-slate-900 dark:text-white" />
        </div>
        <h1 className="text-3xl font-display font-black tracking-tight text-slate-900 dark:text-white uppercase">
          {isOnboarding ? "Finalize Profile" : (showForgot ? "Access Recovery" : "Medical Ecosystem")}
        </h1>
        <p className="text-[10px] text-blue-600 dark:text-blue-400 mt-2 font-black uppercase tracking-[0.2em]">
          Secure Infrastructure for Medical Excellence
        </p>
      </motion.div>

      <div className="w-full bg-white/70 dark:bg-[#05070f]/70 backdrop-blur-[60px] border border-slate-200 dark:border-white/[0.08] rounded-[40px] p-2 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] overflow-hidden">
        
        {/* Tabs */}
        {!isOnboarding && !showForgot && (
          <div className="relative flex p-1.5 mb-6 bg-slate-200/50 dark:bg-white/5 rounded-[30px]">
            <div className={cn("absolute inset-y-1.5 w-[calc(50%-6px)] bg-white dark:bg-blue-600 rounded-[24px] shadow-xl transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]", activeTab === "register" ? "left-[calc(50%)]" : "left-1.5")} />
            <button onClick={() => setActiveTab("login")} className={cn("relative z-10 flex-1 py-4 text-xs font-black uppercase tracking-widest transition-colors", activeTab === "login" ? "text-slate-900 dark:text-white" : "text-slate-500 dark:text-white/30")}>
              Sign In
            </button>
            <button onClick={() => setActiveTab("register")} className={cn("relative z-10 flex-1 py-4 text-xs font-black uppercase tracking-widest transition-colors", activeTab === "register" ? "text-slate-900 dark:text-white" : "text-slate-500 dark:text-white/30")}>
              Establish Profile
            </button>
          </div>
        )}

        <div className="p-4 sm:p-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
          <AnimatePresence mode="wait">
            
            {/* EMAIL NOT CONFIRMED FLOW */}
            {emailNotConfirmed && (
              <motion.div key="not-confirmed" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="text-center py-6 space-y-6">
                <div className="w-20 h-20 mx-auto rounded-[28px] bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20 shadow-2xl shadow-amber-500/10">
                  <EnvelopeSimple size={40} weight="fill" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-black uppercase tracking-widest text-white">Verify Your Email</h3>
                  <p className="text-xs font-bold text-white/40 max-w-xs mx-auto">
                    Your email <span className="text-white font-black">{resendEmail}</span> has not been confirmed yet. Please check your inbox for the verification link.
                  </p>
                </div>
                <div className="space-y-3">
                  <button
                    onClick={handleResendConfirmation}
                    disabled={resendLoading}
                    className="w-full py-4 rounded-[22px] bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-blue-600/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  >
                    {resendLoading ? <CircleNotch className="animate-spin" size={20} /> : <><PaperPlaneTilt weight="fill" size={18} /> Resend Confirmation Email</>}
                  </button>
                  <button
                    onClick={() => { setEmailNotConfirmed(false); setResendEmail(""); }}
                    className="w-full py-3.5 rounded-[22px] bg-white/5 border border-white/10 text-white/60 font-black text-xs uppercase tracking-widest hover:text-white hover:bg-white/10 transition-all"
                  >
                    Back to Sign In
                  </button>
                </div>
              </motion.div>
            )}

            {/* LOGIN FLOW */}
            {activeTab === "login" && !showForgot && !emailNotConfirmed && (
              <motion.form key="login" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} onSubmit={handleEmailAuth} className="space-y-5">
                <div className="space-y-5">
                  <div className="relative group">
                    <EnvelopeSimple className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/20 group-focus-within:text-blue-500 transition-colors" size={20} />
                    <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="Email Terminal Address" 
                      className="w-full bg-slate-100/50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.05] rounded-[24px] py-5 pl-16 pr-8 text-sm font-bold text-slate-900 dark:text-white focus:border-blue-500/50 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-white/10" />
                  </div>
                  <div className="relative group">
                    <LockKey className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/20 group-focus-within:text-blue-500 transition-colors" size={20} />
                    <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="Security Keyphrase" 
                      className="w-full bg-slate-100/50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.05] rounded-[24px] py-5 pl-16 pr-8 text-sm font-bold text-slate-900 dark:text-white focus:border-blue-500/50 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-white/10" />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button type="button" onClick={() => setShowForgot(true)} className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-white/20 hover:text-blue-500 transition-colors">Credential Recovery?</button>
                </div>

                <button type="submit" disabled={loading} className="w-full py-5 rounded-[22px] bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-blue-600/30 active:scale-[0.98] transition-all flex items-center justify-center">
                  {loading ? <CircleNotch className="animate-spin" size={20} /> : "Initiate Connection"}
                </button>
              </motion.form>
            )}

            {/* UNIFIED REGISTER FLOW (SCOPED) */}
            {activeTab === "register" && !showForgot && (
              <motion.form key="register" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} onSubmit={handleEmailAuth} className="space-y-8">
                
                {/* 1. Academic Scoped Selection */}
                <div className="space-y-8 pb-4">
                  <div className="flex items-center gap-4">
                     <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-500 shadow-sm"><Buildings weight="fill" size={24}/></div>
                     <div>
                        <h3 className="text-[12px] font-black uppercase tracking-[0.3em] text-slate-900 dark:text-white">Academic Clearance</h3>
                        <p className="text-[10px] text-slate-500 dark:text-white/20 font-bold uppercase tracking-widest mt-0.5">Identity & Institution</p>
                     </div>
                  </div>
                  
                  <div className="space-y-6">
                    <CustomDropdown 
                      label="University Hub" 
                      options={universities} 
                      value={selectedUni} 
                      onChange={setSelectedUni} 
                      icon={Buildings} 
                      placeholder="Select Medical University"
                    />

                    {selectedUni && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        <CustomDropdown 
                          label="Faculty / Specialization" 
                          options={faculties} 
                          value={selectedFaculty} 
                          onChange={setSelectedFaculty} 
                          icon={GraduationCap} 
                          placeholder="Select Faculty"
                        />
                      </motion.div>
                    )}

                    {selectedFaculty && (
                      <div className="grid grid-cols-2 gap-5">
                        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
                          <CustomDropdown 
                            label="Academic Year" 
                            options={years} 
                            value={selectedYear} 
                            onChange={setSelectedYear} 
                            icon={Calendar} 
                            placeholder="Select Year"
                          />
                        </motion.div>
                        <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}>
                          <CustomDropdown 
                            label="Semester" 
                            options={semesters} 
                            value={selectedSem} 
                            onChange={setSelectedSem} 
                            icon={BookOpen} 
                            placeholder="Select Sem"
                          />
                        </motion.div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Personal Credentials */}
                {selectedSem && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 border-t border-slate-200 dark:border-white/5 pt-10">
                    <div className="flex items-center gap-4">
                       <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-500 shadow-sm"><User weight="fill" size={24}/></div>
                       <div>
                          <h3 className="text-[12px] font-black uppercase tracking-[0.3em] text-slate-900 dark:text-white">Account Protocols</h3>
                          <p className="text-[10px] text-slate-500 dark:text-white/20 font-bold uppercase tracking-widest mt-0.5">Secure Credentials</p>
                       </div>
                    </div>
                    
                    <div className="space-y-5">
                      <div className="relative group">
                        <User className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/20" size={18} />
                        <input type="text" required value={name} onChange={e => setName(e.target.value)} placeholder="Full Legal Name" 
                          className="w-full bg-slate-100/50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.05] rounded-[24px] py-4.5 pl-15 pr-8 text-sm font-bold text-slate-900 dark:text-white focus:border-blue-500/50 outline-none transition-all" />
                      </div>
                      <div className="relative group">
                        <EnvelopeSimple className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/20" size={18} />
                        <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="Official Email Address" 
                          className="w-full bg-slate-100/50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.05] rounded-[24px] py-4.5 pl-15 pr-8 text-sm font-bold text-slate-900 dark:text-white focus:border-blue-500/50 outline-none transition-all" />
                      </div>
                      <div className="relative group">
                        <LockKey className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/20" size={18} />
                        <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="Global Passphrase" 
                          className="w-full bg-slate-100/50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.05] rounded-[24px] py-4.5 pl-15 pr-8 text-sm font-bold text-slate-900 dark:text-white focus:border-blue-500/50 outline-none transition-all" />
                      </div>
                    </div>

                    <button type="submit" disabled={loading} className="w-full py-5 rounded-[22px] bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-blue-600/30 active:scale-[0.98] transition-all flex items-center justify-center gap-3">
                      {loading ? <CircleNotch className="animate-spin" size={20} /> : <><ShieldCheck weight="fill" size={20}/> Finalize Clearance</>}
                    </button>
                  </motion.div>
                )}
              </motion.form>
            )}

            {/* FORGOT PASSWORD */}
            {showForgot && (
              <motion.div key="forgot" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
                {!forgotSent ? (
                  <>
                    <div className="flex items-center gap-4">
                      <button onClick={() => setShowForgot(false)} className="p-3 bg-slate-100 dark:bg-white/[0.05] hover:bg-slate-200 dark:hover:bg-white/10 rounded-2xl text-slate-900 dark:text-white transition-all"><ArrowLeft size={20}/></button>
                      <div>
                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">Protocol Recovery</h3>
                        <p className="text-[10px] font-bold text-slate-500 dark:text-white/30 uppercase mt-1">Identity verification required</p>
                      </div>
                    </div>
                    <form onSubmit={handleForgotPassword} className="space-y-4">
                      <div className="relative group">
                        <EnvelopeSimple className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/20" size={18} />
                        <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="Registered Recovery Email"
                          className="w-full bg-slate-100/50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.05] rounded-[22px] py-4.5 pl-14 pr-6 text-sm font-bold text-slate-900 dark:text-white focus:border-blue-500/50 outline-none transition-all" />
                      </div>
                      <button type="submit" disabled={loading} className="w-full py-5 rounded-[22px] bg-blue-600 text-white font-black text-xs uppercase tracking-[0.2em] shadow-lg flex items-center justify-center gap-3">
                        {loading ? <CircleNotch className="animate-spin" size={20} /> : <><PaperPlaneTilt weight="fill" size={20}/> Dispatch Access Link</>}
                      </button>
                    </form>
                  </>
                ) : (
                  <div className="text-center py-10 space-y-6">
                    <div className="w-24 h-24 mx-auto rounded-[32px] bg-green-500/10 flex items-center justify-center text-green-500 border border-green-500/20 shadow-2xl shadow-green-500/20"><CheckCircle size={48} weight="fill" /></div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-black uppercase tracking-widest text-white">Transmission Sent</h3>
                      <p className="text-xs font-bold text-white/40 uppercase tracking-tighter">Check your secure inbox for instructions</p>
                    </div>
                    <button onClick={() => setShowForgot(false)} className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400 hover:underline">Return to Terminal</button>
                  </div>
                )}
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.05); border-radius: 20px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(59, 130, 246, 0.3); }
      `}</style>
    </div>
  );
}

export default function UnifiedAuthPage() {
  return (
    <div className="relative min-h-screen flex flex-col bg-slate-50 dark:bg-[#05070f] selection:bg-blue-500/30 overflow-hidden">
      <CinematicBackground />
      <Suspense fallback={<div className="flex-1 flex items-center justify-center"><CircleNotch className="animate-spin text-blue-500" size={32} /></div>}>
        <AuthContent />
      </Suspense>
    </div>
  );
}
