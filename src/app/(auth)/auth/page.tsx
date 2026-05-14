"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { GoogleOAuthProvider, useGoogleOneTapLogin, useGoogleLogin } from "@react-oauth/google";
import { 
  EnvelopeSimple, LockKey, User, Phone, 
  Buildings, GraduationCap, Calendar, BookOpen, 
  CaretRight, CaretLeft, CircleNotch, CheckCircle, Sparkle 
} from "@phosphor-icons/react";
import { MedOneXLogoMark } from "@/components/branding/MedQsLogo";
import toast from "react-hot-toast";
import { unwrapApiList } from "@/lib/api-list";
import { cn } from "@/lib/utils";

const CosmicBackground = () => (
  <div className="fixed inset-0 overflow-hidden pointer-events-none bg-[#050014] z-0">
    <div className="absolute top-0 left-0 w-full h-full opacity-40">
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-violet-600/30 blur-[150px]" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-blue-600/20 blur-[150px]" />
      <div className="absolute top-[40%] left-[30%] w-[30%] h-[30%] rounded-full bg-fuchsia-600/10 blur-[120px]" />
    </div>
    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
    
    {/* Floating Stars */}
    <motion.div animate={{ y: [0, -20, 0], opacity: [0.5, 1, 0.5] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} className="absolute top-[15%] left-[20%] text-blue-200/60">
      <Sparkle weight="fill" size={24} />
    </motion.div>
    <motion.div animate={{ y: [0, 20, 0], opacity: [0.3, 0.8, 0.3] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }} className="absolute top-[25%] right-[25%] text-violet-300/50">
      <Sparkle weight="fill" size={32} />
    </motion.div>
    <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.6, 0.2] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 2 }} className="absolute bottom-[20%] left-[30%] text-fuchsia-200/40">
      <Sparkle weight="fill" size={20} />
    </motion.div>
    
    {/* Horizon Glow */}
    <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-violet-900/20 to-transparent" />
    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[1000px] h-px bg-gradient-to-r from-transparent via-violet-500/50 to-transparent" />
  </div>
);

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  
  const initialMode = searchParams.get("mode") as "login" | "register" | "onboarding" || "login";
  const [mode, setMode] = useState<"login" | "register" | "onboarding">(initialMode);
  const [step, setStep] = useState(1);
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

  const saveProfileData = async (userId?: string) => {
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

  // Google One Tap Hook (Triggers only when at login or final step of register)
  useGoogleOneTapLogin({
    onSuccess: async (credentialResponse) => {
      setLoading(true);
      try {
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: credentialResponse.credential!,
        });
        if (error) throw error;

        // If registering or onboarding, save the academic data immediately
        if (mode === "register" || mode === "onboarding") {
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

  const handleAppleLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: { redirectTo: `${window.location.origin}/api/auth/callback` }
    });
    if (error) { toast.error(error.message); setLoading(false); }
  };

  // Standard Email Auth
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return toast.error("Please fill in all fields.");
    setLoading(true);

    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back!");
        router.push("/dashboard");
      } else {
        // Registration Flow
        if (!selectedUni || !selectedSem) return toast.error("Academic data is missing.");
        const { data, error } = await supabase.auth.signUp({
          email, password,
          options: { data: { name, phone } }
        });
        if (error) throw error;
        
        // Save academic profile
        await saveProfileData();
        
        if (data.session) {
          toast.success("Account created successfully!");
          router.push("/dashboard");
        } else {
          toast.success("Confirmation email sent!");
          setMode("login");
        }
      }
    } catch (err: any) {
      toast.error(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative z-10 w-full max-w-[420px] flex flex-col items-center px-4 pt-12 pb-24 mx-auto">
      <div className="mb-8 flex flex-col items-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-[24px] bg-white/[0.03] border border-white/[0.08] shadow-[0_0_40px_rgba(124,58,237,0.15)] backdrop-blur-xl mb-4">
          <MedOneXLogoMark className="h-10 w-10 text-violet-400" interactiveColor={true} />
        </div>
        <h1 className="text-2xl font-display font-black text-white tracking-tight">
          {mode === "login" ? "Welcome back✨!" : "Join MedOneX✨!"}
        </h1>
        <p className="text-xs text-white/40 mt-1.5 font-medium tracking-wide">
          {mode === "login" ? "Log in to your medical workspace" : "Set up your academic profile"}
        </p>
      </div>

      <motion.div 
        layout
        className="w-full bg-[#0F0A1F]/60 backdrop-blur-2xl border border-white/[0.08] rounded-[32px] p-6 shadow-[0_30px_60px_rgba(0,0,0,0.4)]"
      >
        <AnimatePresence mode="wait">
          
          {/* LOGIN MODE */}
          {mode === "login" && (
            <motion.form key="login" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} onSubmit={handleEmailAuth} className="space-y-4">
              <div className="space-y-3">
                <div className="relative group">
                  <EnvelopeSimple className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-violet-400 transition-colors" size={20} />
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="Email Address" 
                    className="w-full bg-white/[0.03] border border-white/[0.05] rounded-2xl py-4 pl-12 pr-4 text-sm text-white focus:border-violet-500/50 focus:bg-white/[0.05] outline-none transition-all placeholder:text-white/20" />
                </div>
                <div className="relative group">
                  <LockKey className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-violet-400 transition-colors" size={20} />
                  <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" 
                    className="w-full bg-white/[0.03] border border-white/[0.05] rounded-2xl py-4 pl-12 pr-4 text-sm text-white focus:border-violet-500/50 focus:bg-white/[0.05] outline-none transition-all placeholder:text-white/20" />
                </div>
              </div>

              <button type="submit" disabled={loading} className="w-full relative group overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 p-px">
                <div className="relative bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-2xl py-4 flex items-center justify-center font-bold text-white tracking-wide transition-all group-hover:opacity-90 active:scale-[0.98]">
                  {loading ? <CircleNotch className="animate-spin" size={20} /> : "SIGN IN"}
                </div>
              </button>

              <div className="py-2 flex items-center justify-center gap-4">
                <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                <span className="text-[10px] text-white/30 uppercase font-black tracking-widest shrink-0">OR</span>
                <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              </div>

              <div className="flex gap-3 justify-center">
                {/* Google handled by One Tap, but we can add a fallback button if needed */}
                <button type="button" onClick={() => {
                  const btn = document.querySelector('[role="button"][aria-labelledby="button-label"]') as HTMLElement;
                  if(btn) btn.click();
                }} className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center hover:bg-white/[0.08] hover:border-white/20 transition-all hover:-translate-y-1">
                  <svg className="w-6 h-6" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.83c.87-2.6 3.3-4.52 6.16-4.52z"/></svg>
                </button>
              </div>

              <p className="text-center text-xs text-white/40 mt-6">
                Don't have an account? <button type="button" onClick={() => setMode("register")} className="text-violet-400 hover:text-violet-300 font-bold ml-1">Create one</button>
              </p>
            </motion.form>
          )}

          {/* REGISTER & ONBOARDING MODE */}
          {(mode === "register" || mode === "onboarding") && (
            <motion.div key="register" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              
              {/* Stepper Header */}
              <div className="flex gap-2 mb-8 justify-center">
                {[1, 2, 3].map(i => (
                  <div key={i} className={cn("h-1.5 w-12 rounded-full transition-all duration-500", step >= i ? "bg-violet-500 shadow-[0_0_10px_rgba(139,92,246,0.5)]" : "bg-white/[0.05]")} />
                ))}
              </div>

              {/* Step 1: Academic Info */}
              {step === 1 && (
                <div className="space-y-4">
                  <h3 className="text-white font-bold mb-4 flex items-center gap-2"><Buildings size={20} className="text-violet-400"/> Academic Profile</h3>
                  
                  {universities.length === 0 ? <div className="py-8 flex justify-center"><CircleNotch className="animate-spin text-violet-400" size={24} /></div> : (
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                      {universities.map(uni => (
                        <button key={uni.id} onClick={() => { setSelectedUni(uni); setStep(2); }}
                          className={cn("w-full flex items-center gap-4 p-4 rounded-2xl border transition-all hover:bg-white/[0.05]", selectedUni?.id === uni.id ? "bg-violet-500/10 border-violet-500/50" : "bg-white/[0.02] border-white/[0.05]")}>
                          <div className="w-10 h-10 rounded-xl bg-white/[0.05] flex items-center justify-center shrink-0">
                            {uni.logoUrl ? <img src={uni.logoUrl} className="w-6 h-6 object-contain"/> : <Buildings className="text-white/40"/>}
                          </div>
                          <span className="text-sm font-bold text-white/90 text-left flex-1">{uni.name}</span>
                          <CaretRight className="text-white/20"/>
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
                    <button onClick={() => setStep(1)} className="p-2 bg-white/[0.05] hover:bg-white/10 rounded-lg text-white/60 transition-colors"><CaretLeft size={16}/></button>
                    <h3 className="text-white font-bold flex items-center gap-2"><GraduationCap size={20} className="text-violet-400"/> Current Stage</h3>
                  </div>

                  {hasFaculties === null ? (
                    <div className="py-8 flex justify-center"><CircleNotch className="animate-spin text-violet-400" size={24} /></div>
                  ) : (
                    <>
                      {hasFaculties && faculties.length > 0 && !selectedFaculty && (
                        <div className="space-y-2 animate-in slide-in-from-top-2">
                          <p className="text-xs text-white/40 uppercase tracking-widest font-bold mb-2 ml-1">Select Faculty</p>
                          {faculties.map(fac => (
                            <button key={fac.id} onClick={() => setSelectedFaculty(fac)}
                              className="w-full flex items-center p-4 rounded-2xl border bg-white/[0.02] border-white/[0.05] hover:bg-white/[0.05] transition-all text-sm font-bold text-white/90 text-left">
                              {fac.name}
                            </button>
                          ))}
                        </div>
                      )}

                      {(hasFaculties === false || selectedFaculty) && (
                        <div className="space-y-4 animate-in slide-in-from-top-2">
                          {years.length === 0 ? (
                            <div className="text-center text-xs text-white/30 py-4">No academic years found.</div>
                          ) : (
                            <div className="grid grid-cols-3 gap-2">
                              {years.filter(y => !selectedFaculty || y.facultyId === selectedFaculty.id).map(year => (
                                <button key={year.id} onClick={() => { setSelectedYear(year); setSelectedSem(null); }}
                                  className={cn("p-3 rounded-2xl border transition-all text-center flex flex-col items-center gap-1", selectedYear?.id === year.id ? "bg-violet-500/10 border-violet-500/50 text-violet-300" : "bg-white/[0.02] border-white/[0.05] text-white/50 hover:bg-white/[0.05]")}>
                                  <Calendar size={16} />
                                  <span className="text-xs font-bold">Year {year.yearNumber}</span>
                                </button>
                              ))}
                            </div>
                          )}

                          {selectedYear && (
                            <div className="space-y-2 mt-4 animate-in slide-in-from-top-2">
                              {semesters.length === 0 ? (
                                <div className="text-center text-xs text-white/30 py-4">Loading semesters...</div>
                              ) : (
                                semesters.map(sem => (
                                  <button key={sem.id} onClick={() => setSelectedSem(sem)}
                                    className={cn("w-full flex items-center justify-between p-4 rounded-2xl border transition-all text-sm font-bold text-left", selectedSem?.id === sem.id ? "bg-violet-500/10 border-violet-500/50 text-white" : "bg-white/[0.02] border-white/[0.05] text-white/70 hover:bg-white/[0.05]")}>
                                    <div className="flex items-center gap-3"><BookOpen size={18} className={selectedSem?.id === sem.id ? "text-violet-400" : "text-white/20"}/> {sem.name}</div>
                                    {selectedSem?.id === sem.id && <CheckCircle size={18} className="text-violet-400" weight="fill" />}
                                  </button>
                                ))
                              )}
                            </div>
                          )}

                          <button disabled={!selectedSem} onClick={() => setStep(3)} className="w-full mt-4 py-4 rounded-2xl bg-violet-600 text-white font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition-opacity">
                            Continue <CaretRight />
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
                    <button onClick={() => setStep(2)} className="p-2 bg-white/[0.05] hover:bg-white/10 rounded-lg text-white/60 transition-colors"><CaretLeft size={16}/></button>
                    <h3 className="text-white font-bold flex items-center gap-2"><User size={20} className="text-violet-400"/> Secure Account</h3>
                  </div>

                  <form onSubmit={handleEmailAuth} className="space-y-3">
                    <div className="relative group">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={20} />
                      <input type="text" required value={name} onChange={e => setName(e.target.value)} placeholder="Full Name" 
                        className="w-full bg-white/[0.03] border border-white/[0.05] rounded-2xl py-4 pl-12 pr-4 text-sm text-white focus:border-violet-500/50 outline-none placeholder:text-white/20" />
                    </div>
                    <div className="relative group">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={20} />
                      <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone Number (Optional)" 
                        className="w-full bg-white/[0.03] border border-white/[0.05] rounded-2xl py-4 pl-12 pr-4 text-sm text-white focus:border-violet-500/50 outline-none placeholder:text-white/20" />
                    </div>

                    <div className="h-px bg-white/5 my-4" />

                    <div className="relative group">
                      <EnvelopeSimple className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={20} />
                      <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="Email Address" 
                        className="w-full bg-white/[0.03] border border-white/[0.05] rounded-2xl py-4 pl-12 pr-4 text-sm text-white focus:border-violet-500/50 outline-none placeholder:text-white/20" />
                    </div>
                    <div className="relative group">
                      <LockKey className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={20} />
                      <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="Create Password" 
                        className="w-full bg-white/[0.03] border border-white/[0.05] rounded-2xl py-4 pl-12 pr-4 text-sm text-white focus:border-violet-500/50 outline-none placeholder:text-white/20" />
                    </div>

                    <button type="submit" disabled={loading} className="w-full mt-2 relative group overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 p-px">
                      <div className="relative bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-2xl py-4 flex items-center justify-center font-bold text-white tracking-wide transition-all group-hover:opacity-90 active:scale-[0.98]">
                        {loading ? <CircleNotch className="animate-spin" size={20} /> : "COMPLETE REGISTRATION"}
                      </div>
                    </button>
                  </form>

                  {/* Google One Tap will float securely on top of this! */}
                  <div className="text-center text-xs text-white/30 pt-4">
                    Or use the secure Google prompt appearing on your screen ✦
                  </div>
                </div>
              )}

              {mode !== "onboarding" && (
                <p className="text-center text-xs text-white/40 mt-6">
                  Already have an account? <button type="button" onClick={() => {setMode("login"); setStep(1);}} className="text-violet-400 hover:text-violet-300 font-bold ml-1">Sign In</button>
                </p>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </motion.div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
      `}</style>
    </div>
  );
}

export default function UnifiedAuthPage() {
  return (
    <div className="relative min-h-screen flex flex-col bg-[#050014] selection:bg-violet-500/30">
      <CosmicBackground />
      <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ""}>
        <Suspense fallback={<div className="flex-1 flex items-center justify-center"><CircleNotch className="animate-spin text-violet-500" size={32} /></div>}>
          <AuthContent />
        </Suspense>
      </GoogleOAuthProvider>
    </div>
  );
}
