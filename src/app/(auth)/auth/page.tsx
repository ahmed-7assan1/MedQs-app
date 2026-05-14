"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { GoogleOAuthProvider, useGoogleOneTapLogin, useGoogleLogin } from "@react-oauth/google";
import { 
  EnvelopeSimple, LockKey, User, Phone, 
  Buildings, GraduationCap, Calendar, BookOpen, 
  CaretRight, CaretLeft, CircleNotch, CheckCircle, 
  ShieldCheck, Brain
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
  
  const initialMode = searchParams.get("mode") as "login" | "register" | "onboarding" || "login";
  
  // If user is just onboarding (completing profile), lock them in the register flow
  const isOnboarding = initialMode === "onboarding";
  const [activeTab, setActiveTab] = useState<"login" | "register">(isOnboarding ? "register" : (initialMode === "register" ? "register" : "login"));
  
  const [step, setStep] = useState(isOnboarding ? 1 : 1);
  const [loading, setLoading] = useState(false);

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
      
      Promise.all([
        fetch(`/api/v1/faculties?universityId=${selectedUni.id}`).then(r => r.json()),
        fetch(`/api/v1/academic-years?universityId=${selectedUni.id}`).then(r => r.json())
      ]).then(([facData, yearData]) => {
        const facList = unwrapApiList(facData);
        const yearList = unwrapApiList(yearData);
        
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

  // Google One Tap Hook (Triggers when at login or final step of register)
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
    onError: () => toast.error("Google login failed"),
    cancel_on_tap_outside: false,
  });

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return toast.error("Please fill in all fields.");
    setLoading(true);

    try {
      if (activeTab === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back!");
        router.push("/dashboard");
      } else {
        if (!selectedUni || !selectedSem) return toast.error("Academic data is missing.");
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
          toast.success("Confirmation email sent!");
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

  return (
    <div className="relative z-10 w-full max-w-[440px] flex flex-col items-center px-4 pt-12 pb-24 mx-auto">
      
      {/* Brand Header */}
      <div className="mb-10 flex flex-col items-center text-center">
        <div className="p-4 rounded-[24px] bg-white/40 dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-xl backdrop-blur-xl mb-6">
          <MedOneXLogoMark className="h-12 w-12 text-slate-900 dark:text-white" />
        </div>
        <h1 className="text-3xl font-display font-black tracking-tight text-slate-900 dark:text-white">
          {isOnboarding ? "Complete Your Profile" : "Medical Excellence"}
        </h1>
        <p className="text-sm text-slate-500 dark:text-white/50 mt-2 font-medium">
          {isOnboarding ? "We need a few more details to set up your workspace." : "Master Medicine. Faster. Smarter."}
        </p>
      </div>

      <div className="w-full bg-white/60 dark:bg-[#05070f]/60 backdrop-blur-3xl border border-slate-200 dark:border-white/10 rounded-[32px] p-2 shadow-2xl">
        
        {/* Tabs */}
        {!isOnboarding && (
          <div className="relative flex p-1 mb-6 bg-slate-200/50 dark:bg-white/5 rounded-[24px]">
            <div className={cn("absolute inset-y-1 w-[calc(50%-4px)] bg-white dark:bg-[#1a1f3c] rounded-[20px] shadow-sm transition-all duration-300 ease-out", activeTab === "register" ? "left-[calc(50%)]" : "left-1")} />
            <button onClick={() => { setActiveTab("login"); setStep(1); }} className={cn("relative z-10 flex-1 py-3 text-sm font-bold transition-colors", activeTab === "login" ? "text-slate-900 dark:text-white" : "text-slate-500 dark:text-white/40")}>
              Sign In
            </button>
            <button onClick={() => setActiveTab("register")} className={cn("relative z-10 flex-1 py-3 text-sm font-bold transition-colors", activeTab === "register" ? "text-slate-900 dark:text-white" : "text-slate-500 dark:text-white/40")}>
              Create Account
            </button>
          </div>
        )}

        <div className="p-4 sm:p-6">
          <AnimatePresence mode="wait">
            
            {/* LOGIN FLOW */}
            {activeTab === "login" && (
              <motion.form key="login" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} onSubmit={handleEmailAuth} className="space-y-5">
                <div className="space-y-4">
                  <div className="relative group">
                    <EnvelopeSimple className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/20 group-focus-within:text-blue-500 transition-colors" size={20} />
                    <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="Email Address" 
                      className="w-full bg-slate-100/50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.05] rounded-2xl py-4 pl-12 pr-4 text-sm text-slate-900 dark:text-white focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-white/20" />
                  </div>
                  <div className="relative group">
                    <LockKey className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/20 group-focus-within:text-blue-500 transition-colors" size={20} />
                    <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" 
                      className="w-full bg-slate-100/50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.05] rounded-2xl py-4 pl-12 pr-4 text-sm text-slate-900 dark:text-white focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-white/20" />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button type="button" className="text-xs font-bold text-slate-500 dark:text-white/40 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Forgot Password?</button>
                </div>

                <button type="submit" disabled={loading} className="w-full group overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 p-px shadow-xl shadow-blue-500/20 active:scale-[0.98] transition-all">
                  <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl py-4 flex items-center justify-center font-bold text-white tracking-wide group-hover:opacity-90">
                    {loading ? <CircleNotch className="animate-spin" size={20} /> : "Sign In to Workspace"}
                  </div>
                </button>

                <div className="py-2 flex items-center justify-center gap-4">
                  <div className="h-px w-full bg-slate-200 dark:bg-white/10" />
                  <span className="text-[10px] text-slate-400 dark:text-white/30 uppercase font-black tracking-widest shrink-0">OR</span>
                  <div className="h-px w-full bg-slate-200 dark:bg-white/10" />
                </div>

                <button type="button" onClick={handleGoogleClick} className="w-full py-4 rounded-2xl bg-slate-100/50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] flex items-center justify-center gap-3 hover:bg-slate-200/50 dark:hover:bg-white/[0.08] transition-all font-bold text-sm text-slate-700 dark:text-white/90">
                  <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.83c.87-2.6 3.3-4.52 6.16-4.52z"/></svg>
                  Continue with Google
                </button>
              </motion.form>
            )}

            {/* REGISTER & ONBOARDING FLOW */}
            {activeTab === "register" && (
              <motion.div key="register" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                
                {/* Stepper Header */}
                <div className="flex gap-2 mb-8 justify-center">
                  {[1, 2, 3].map(i => (
                    <div key={i} className={cn("h-1.5 w-12 rounded-full transition-all duration-500", step >= i ? "bg-blue-500 shadow-sm" : "bg-slate-200 dark:bg-white/[0.05]")} />
                  ))}
                </div>

                {/* Step 1: Academic Info */}
                {step === 1 && (
                  <div className="space-y-4">
                    <h3 className="text-slate-900 dark:text-white font-bold mb-4 flex items-center gap-2"><Buildings size={20} className="text-blue-500"/> Select University</h3>
                    
                    {universities.length === 0 ? <div className="py-8 flex justify-center"><CircleNotch className="animate-spin text-blue-500" size={24} /></div> : (
                      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {universities.map(uni => (
                          <button key={uni.id} onClick={() => { setSelectedUni(uni); setStep(2); }}
                            className={cn("w-full flex items-center gap-4 p-4 rounded-2xl border transition-all", selectedUni?.id === uni.id ? "bg-blue-50 dark:bg-blue-500/10 border-blue-500/50" : "bg-slate-50 dark:bg-white/[0.02] border-slate-200 dark:border-white/[0.05] hover:bg-slate-100 dark:hover:bg-white/[0.05]")}>
                            <div className="w-10 h-10 rounded-xl bg-white dark:bg-white/[0.05] border border-slate-100 dark:border-transparent flex items-center justify-center shrink-0 shadow-sm">
                              {uni.logoUrl ? <img src={uni.logoUrl} className="w-6 h-6 object-contain"/> : <Buildings className="text-slate-400 dark:text-white/40"/>}
                            </div>
                            <span className="text-sm font-bold text-slate-700 dark:text-white/90 text-left flex-1">{uni.name}</span>
                            <CaretRight className="text-slate-400 dark:text-white/20"/>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Step 2: Faculty & Semester */}
                {step === 2 && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-4">
                      <button onClick={() => setStep(1)} className="p-2 bg-slate-100 dark:bg-white/[0.05] hover:bg-slate-200 dark:hover:bg-white/10 rounded-lg text-slate-500 dark:text-white/60 transition-colors"><CaretLeft size={16}/></button>
                      <h3 className="text-slate-900 dark:text-white font-bold flex items-center gap-2"><GraduationCap size={20} className="text-blue-500"/> Academic Stage</h3>
                    </div>

                    {hasFaculties === null ? (
                      <div className="py-8 flex justify-center"><CircleNotch className="animate-spin text-blue-500" size={24} /></div>
                    ) : (
                      <>
                        {hasFaculties && faculties.length > 0 && !selectedFaculty && (
                          <div className="space-y-2 animate-in slide-in-from-top-2">
                            <p className="text-xs text-slate-500 dark:text-white/40 uppercase tracking-widest font-bold mb-2 ml-1">Select Faculty</p>
                            {faculties.map(fac => (
                              <button key={fac.id} onClick={() => setSelectedFaculty(fac)}
                                className="w-full flex items-center p-4 rounded-2xl border bg-slate-50 dark:bg-white/[0.02] border-slate-200 dark:border-white/[0.05] hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-all text-sm font-bold text-slate-700 dark:text-white/90 text-left">
                                {fac.name}
                              </button>
                            ))}
                          </div>
                        )}

                        {(hasFaculties === false || selectedFaculty) && (
                          <div className="space-y-4 animate-in slide-in-from-top-2">
                            {years.length === 0 ? (
                              <div className="text-center text-xs text-slate-500 dark:text-white/30 py-4">No academic years found.</div>
                            ) : (
                              <div className="grid grid-cols-3 gap-2">
                                {years.filter(y => !selectedFaculty || y.facultyId === selectedFaculty.id).map(year => (
                                  <button key={year.id} onClick={() => { setSelectedYear(year); setSelectedSem(null); }}
                                    className={cn("p-3 rounded-2xl border transition-all text-center flex flex-col items-center gap-2 shadow-sm", selectedYear?.id === year.id ? "bg-blue-50 dark:bg-blue-500/10 border-blue-500/50 text-blue-600 dark:text-blue-300" : "bg-slate-50 dark:bg-white/[0.02] border-slate-200 dark:border-white/[0.05] text-slate-500 dark:text-white/50 hover:bg-slate-100 dark:hover:bg-white/[0.05]")}>
                                    <Calendar size={18} />
                                    <span className="text-xs font-bold">Year {year.yearNumber}</span>
                                  </button>
                                ))}
                              </div>
                            )}

                            {selectedYear && (
                              <div className="space-y-2 mt-4 animate-in slide-in-from-top-2">
                                {semesters.length === 0 ? (
                                  <div className="text-center text-xs text-slate-500 dark:text-white/30 py-4">Loading semesters...</div>
                                ) : (
                                  semesters.map(sem => (
                                    <button key={sem.id} onClick={() => setSelectedSem(sem)}
                                      className={cn("w-full flex items-center justify-between p-4 rounded-2xl border transition-all text-sm font-bold text-left shadow-sm", selectedSem?.id === sem.id ? "bg-blue-50 dark:bg-blue-500/10 border-blue-500/50 text-slate-900 dark:text-white" : "bg-slate-50 dark:bg-white/[0.02] border-slate-200 dark:border-white/[0.05] text-slate-600 dark:text-white/70 hover:bg-slate-100 dark:hover:bg-white/[0.05]")}>
                                      <div className="flex items-center gap-3"><BookOpen size={18} className={selectedSem?.id === sem.id ? "text-blue-500" : "text-slate-400 dark:text-white/20"}/> {sem.name}</div>
                                      {selectedSem?.id === sem.id && <CheckCircle size={18} className="text-blue-500" weight="fill" />}
                                    </button>
                                  ))
                                )}
                              </div>
                            )}

                            <button disabled={!selectedSem} onClick={() => setStep(3)} className="w-full mt-4 py-4 rounded-2xl bg-slate-900 dark:bg-blue-600 text-white font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition-opacity shadow-lg shadow-slate-900/20 dark:shadow-blue-600/20">
                              Continue to Profile <CaretRight />
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* Step 3: Account & Credentials */}
                {step === 3 && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-4">
                      <button onClick={() => setStep(2)} className="p-2 bg-slate-100 dark:bg-white/[0.05] hover:bg-slate-200 dark:hover:bg-white/10 rounded-lg text-slate-500 dark:text-white/60 transition-colors"><CaretLeft size={16}/></button>
                      <h3 className="text-slate-900 dark:text-white font-bold flex items-center gap-2"><ShieldCheck size={20} className="text-blue-500"/> Secure Account</h3>
                    </div>

                    <form onSubmit={handleEmailAuth} className="space-y-4">
                      <div className="space-y-3">
                        <div className="relative group">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/20 group-focus-within:text-blue-500 transition-colors" size={20} />
                          <input type="text" required value={name} onChange={e => setName(e.target.value)} placeholder="Full Name" 
                            className="w-full bg-slate-100/50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.05] rounded-2xl py-4 pl-12 pr-4 text-sm text-slate-900 dark:text-white focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-white/20" />
                        </div>
                        <div className="relative group">
                          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/20 group-focus-within:text-blue-500 transition-colors" size={20} />
                          <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone Number (Optional)" 
                            className="w-full bg-slate-100/50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.05] rounded-2xl py-4 pl-12 pr-4 text-sm text-slate-900 dark:text-white focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-white/20" />
                        </div>

                        <div className="h-px bg-slate-200 dark:bg-white/10 my-4" />

                        <div className="relative group">
                          <EnvelopeSimple className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/20 group-focus-within:text-blue-500 transition-colors" size={20} />
                          <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="Email Address" 
                            className="w-full bg-slate-100/50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.05] rounded-2xl py-4 pl-12 pr-4 text-sm text-slate-900 dark:text-white focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-white/20" />
                        </div>
                        <div className="relative group">
                          <LockKey className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/20 group-focus-within:text-blue-500 transition-colors" size={20} />
                          <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="Create Password" 
                            className="w-full bg-slate-100/50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.05] rounded-2xl py-4 pl-12 pr-4 text-sm text-slate-900 dark:text-white focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-white/20" />
                        </div>
                      </div>

                      <button type="submit" disabled={loading} className="w-full mt-4 group overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 p-px shadow-xl shadow-blue-500/20 active:scale-[0.98] transition-all">
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl py-4 flex items-center justify-center font-bold text-white tracking-wide group-hover:opacity-90">
                          {loading ? <CircleNotch className="animate-spin" size={20} /> : "Complete Registration"}
                        </div>
                      </button>
                    </form>

                    <div className="text-center text-xs font-medium text-slate-400 dark:text-white/40 pt-4 flex items-center justify-center gap-1">
                      <Brain size={14} className="text-blue-500"/> Or use the secure Google prompt on your screen.
                    </div>
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
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(148, 163, 184, 0.3); border-radius: 10px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); }
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
