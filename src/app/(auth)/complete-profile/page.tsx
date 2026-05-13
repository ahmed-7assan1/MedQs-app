"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Buildings as Building2,
  Calendar,
  BookOpen,
  CaretRight,
  CircleNotch as Loader2,
  CheckCircle as CheckCircle2,
  User,
  Phone,
  FileText,
  ArrowLeft,
  Sparkle,
  GraduationCap,
  PaperPlaneTilt,
  CaretLeft
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { MedQsLogoMark } from "@/components/branding/MedQsLogo";
import toast from "react-hot-toast";
import { unwrapApiList } from "@/lib/api-list";
import { createClient } from "@/lib/supabase/client";

interface University  { id: string; name: string; logoUrl?: string }
interface Faculty     { id: string; name: string; logoUrl?: string; universityId: string }
interface AcademicYear { id: string; yearNumber: number; universityId: string; facultyId?: string | null }
interface Semester     { id: string; name: string; academicYearId: string }

type Step = 0 | 1 | 2 | 3 | 4 | 5 | 6;

const STEP_META = [
  { n: 0, label: "Account Setup" },
  { n: 1, label: "University" },
  { n: 2, label: "Faculty" },
  { n: 3, label: "Year & Semester" },
  { n: 4, label: "Telegram Identity" },
  { n: 5, label: "Your Profile" },
  { n: 6, label: "Done!" },
];

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();
  const [step, setStep] = useState<Step>(0);

  // Data
  const [universities, setUniversities] = useState<University[]>([]);
  const [faculties,    setFaculties]    = useState<Faculty[]>([]);
  const [years,        setYears]        = useState<AcademicYear[]>([]);
  const [semesters,    setSemesters]    = useState<Semester[]>([]);

  // Selections
  const [selectedUni,     setSelectedUni]     = useState<University | null>(null);
  const [selectedFaculty, setSelectedFaculty] = useState<Faculty | null>(null);
  const [hasFaculties,    setHasFaculties]    = useState<boolean | null>(null); // null = loading
  const [selectedYear,    setSelectedYear]    = useState<AcademicYear | null>(null);
  const [selectedSem,     setSelectedSem]     = useState<Semester | null>(null);

  // Profile fields
  const [nickname,      setNickname]      = useState("");
  const [password,      setPassword]      = useState("");
  const [phone,         setPhone]         = useState("");
  const [studentId,     setStudentId]     = useState("");
  const [bio,           setBio]           = useState("");
  const [telegramPhone, setTelegramPhone] = useState("");
  const [vCode,         setVCode]         = useState("");
  const [vCodeSent,     setVCodeSent]     = useState(false);
  const [vCodeVerified, setVCodeVerified] = useState(false);
  const [retryTimer,    setRetryTimer]    = useState(0);

  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);

  // ── Retry Timer Logic ──────────────────────────────────────────────────────
  useEffect(() => {
    if (retryTimer > 0) {
      const t = setTimeout(() => setRetryTimer(retryTimer - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [retryTimer]);

  // ── Telegram Code Logic ────────────────────────────────────────────────────
  async function handleRequestCode() {
    if (!telegramPhone || telegramPhone.length < 10) {
      return toast.error("Please enter a valid Telegram phone number.");
    }
    setSaving(true);
    try {
      const res = await fetch("/api/v1/auth/telegram/request-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: telegramPhone }),
      });
      const data = await res.json();
      if (res.ok) {
        setVCodeSent(true);
        setRetryTimer(60);
        toast.success("Verification code sent! Check your Telegram bot.");
      } else {
        toast.error(data.error || "Failed to send code. Make sure you started the bot.");
      }
    } finally { setSaving(false); }
  }

  async function handleVerifyCode() {
    if (vCode.length !== 6) return toast.error("Enter the 6-digit code.");
    setSaving(true);
    try {
      const res = await fetch("/api/v1/auth/telegram/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: telegramPhone, code: vCode }),
      });
      const data = await res.json();
      if (res.ok) {
        setVCodeVerified(true);
        toast.success("Telegram verified successfully!");
        setStep(5);
      } else {
        toast.error(data.error || "Invalid code.");
      }
    } finally { setSaving(false); }
  }

  // ── Load universities ───────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const r    = await fetch("/api/v1/universities");
        const data = r.ok ? await r.json() : [];
        setUniversities(Array.isArray(data) ? data : []);
      } finally { setLoading(false); }
    })();
  }, []);

  // ── Load faculties when uni selected ───────────────────────────────────────
  useEffect(() => {
    if (!selectedUni) return;
    setHasFaculties(null);
    (async () => {
      const r    = await fetch(`/api/v1/faculties?universityId=${selectedUni.id}`);
      const data = r.ok ? await r.json() : [];
      const list: Faculty[] = Array.isArray(data) ? data : [];
      setFaculties(list);
      setHasFaculties(list.length > 0);
      // Skip faculty step if no faculties configured
      if (list.length === 0) setStep(3);
    })();
  }, [selectedUni]);

  // ── Load years ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!selectedUni) return;
    (async () => {
      const r    = await fetch(`/api/v1/academic-years?universityId=${selectedUni.id}`);
      const data = r.ok ? await r.json() : [];
      setYears(unwrapApiList<AcademicYear>(data));
    })();
  }, [selectedUni]);

  // ── Load semesters ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!selectedYear) return;
    (async () => {
      const r    = await fetch(`/api/v1/semesters?academicYearId=${selectedYear.id}`);
      const data = r.ok ? await r.json() : [];
      setSemesters(unwrapApiList<Semester>(data));
    })();
  }, [selectedYear]);

  // ── Submit ─────────────────────────────────────────────────────────────────
  async function handleFinish() {
    const nick = nickname.trim();
    const sid  = studentId.trim();
    if (!nick || !/^[a-zA-Z0-9._-]+$/.test(nick)) {
      return toast.error("Username is required (letters, numbers, dot, underscore, dash only).");
    }
    if (!sid || sid.length < 6) {
      return toast.error("Student ID is required (at least 6 characters).");
    }
    if (!selectedUni || !selectedSem) return;

    setSaving(true);
    try {
      // ── Update Supabase Auth Password if set ──
      if (password) {
        const { error: pwdErr } = await supabase.auth.updateUser({ password });
        if (pwdErr) {
          toast.error("Failed to set password: " + pwdErr.message);
          setSaving(false);
          return;
        }
      }

      const res = await fetch("/api/v1/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          universityId: selectedUni.id,
          ...(selectedFaculty ? { facultyId: selectedFaculty.id } : {}),
          semesterId: selectedSem.id,
          nickname: nick,
          studentId: sid,
          phone: phone.trim() || undefined,
          ...(telegramPhone.trim() ? { telegramPhone: telegramPhone.replace(/[^0-9]/g, "") } : {}),
          ...(vCode.trim() ? { verificationCode: vCode } : {}),
          ...(bio.trim()   ? { bio: bio.trim() }     : {}),
        }),
      });

      if (res.ok) {
        setStep(6);
        setTimeout(() => { router.push("/dashboard"); router.refresh(); }, 2200);
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(typeof err?.error === "string" ? err.error : "Something went wrong.");
      }
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
    } finally { setSaving(false); }
  }

  // ── Filtered lists ─────────────────────────────────────────────────────────
  const filteredYears = years.filter(y => {
    if (!selectedFaculty) return !y.facultyId; 
    return y.facultyId === selectedFaculty.id;
  });
  const filteredSems  = semesters;

  // Visible step count (skip faculty step if none)
  const visibleSteps = hasFaculties === false
    ? STEP_META.filter(s => s.n !== 2)
    : STEP_META;

  // ── Progress bar display step (1-4 without faculty, 1-5 with) ─────────────
  const displayStep = hasFaculties === false && step >= 3 ? step - 1 : step;
  const totalSteps  = hasFaculties === false ? 4 : 5;

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-[#09080F]">
      <div className="relative z-10 flex w-full max-w-[400px] flex-col items-center px-6 py-12">
        {/* Logo & Step indicator */}
        <div className="mb-12 flex flex-col items-center gap-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-[24px] bg-[#131220] border border-white/[0.07] shadow-2xl transition-all hover:scale-105 hover:shadow-primary/20">
             <MedQsLogoMark className="h-12 w-12 text-primary" title="MedOneX" interactiveColor={true} />
          </div>
          <div className="flex gap-2">
            {Array.from({ length: totalSteps }, (_, i) => (
              <div key={i} className={cn("h-1.5 w-10 rounded-full transition-all duration-500",
                displayStep > i + 1 ? "bg-primary" :
                displayStep === i + 1 ? "bg-primary/40 shadow-[0_0_8px_rgba(var(--primary-rgb),0.3)]" :
                "bg-white/5")} />
            ))}
          </div>
        </div>

        <div className="w-full">
          {/* ── STEP 0: Account Essentials ── */}
          {step === 0 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h1 className="mb-1 font-display text-2xl font-black tracking-tight text-white">Account Setup</h1>
              <p className="mb-8 text-[13px] text-white/35 font-medium">Set a password and phone for your profile.</p>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 ml-1">Secure Password</label>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Minimum 6 characters" 
                    className="w-full rounded-2xl border border-white/[0.07] bg-[#131220] px-5 py-4 text-sm font-bold text-white outline-none transition-all focus:border-primary/40 focus:ring-4 focus:ring-primary/5 placeholder:text-white/10" />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 ml-1">Phone Number</label>
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+20..." 
                    className="w-full rounded-2xl border border-white/[0.07] bg-[#131220] px-5 py-4 text-sm font-bold text-white outline-none transition-all focus:border-primary/40 focus:ring-4 focus:ring-primary/5 placeholder:text-white/10" />
                </div>

                <button onClick={() => {
                  if (password && password.length < 6) return toast.error("Password must be at least 6 characters");
                  setStep(1);
                }}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl btn-gradient py-5 text-sm font-black uppercase tracking-wider text-white shadow-2xl shadow-primary/20 transition-all hover:opacity-90 active:scale-[0.98]">
                  Continue <CaretRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 1: University ── */}
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h1 className="mb-1 font-display text-2xl font-black tracking-tight text-white">Select University</h1>
              <p className="mb-8 text-[13px] text-white/35 font-medium">Personalize your academic workspace.</p>

              {loading ? (
                <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
              ) : universities.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border py-12 text-center">
                  <Building2 className="mx-auto mb-3 h-8 w-8 text-muted-foreground opacity-20" />
                  <p className="text-sm font-medium">No universities available</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {universities.map(uni => (
                    <button key={uni.id}
                      onClick={() => { setSelectedUni(uni); setSelectedFaculty(null); setSelectedYear(null); setSelectedSem(null); setStep(2); }}
                      className={cn(
                        "flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition-all hover:border-primary/20 hover:bg-white/5 active:scale-[0.98]",
                        selectedUni?.id === uni.id ? "border-primary bg-primary/5" : "border-white/[0.07] bg-[#131220]"
                      )}>
                      <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-white/5 border border-white/10">
                        {uni.logoUrl
                          ? <img src={uni.logoUrl} alt={uni.name} className="h-7 w-7 rounded object-contain" />
                          : <Building2 className="h-5 w-5 text-white/40" />
                        }
                      </div>
                      <span className="flex-1 text-[14px] font-bold text-white/90">{uni.name}</span>
                      <CaretRight className="h-4 w-4 text-white/10" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── STEP 2: Faculty ── */}
          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <button onClick={() => setStep(1)} className="mb-6 flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-white/20 hover:text-white transition-colors">
                <ArrowLeft className="h-3 w-3" /> Back
              </button>
              <h1 className="mb-1 font-display text-2xl font-black tracking-tight text-white">Select Faculty</h1>
              <p className="mb-8 text-[13px] text-white/35 font-medium">{selectedUni?.name}</p>

              {hasFaculties === null ? (
                <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
              ) : (
                <div className="space-y-2.5">
                  {faculties.map(fac => (
                    <button key={fac.id}
                      onClick={() => { setSelectedFaculty(fac); setSelectedYear(null); setSelectedSem(null); setStep(3); }}
                      className={cn(
                        "flex w-full items-center gap-4 rounded-xl border p-4 text-left transition-all hover:border-primary/20 hover:bg-muted/50 active:scale-[0.98]",
                        selectedFaculty?.id === fac.id ? "border-primary bg-primary/5" : "border-border bg-card"
                      )}>
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        {fac.logoUrl
                          ? <img src={fac.logoUrl} alt={fac.name} className="h-7 w-7 rounded object-contain" />
                          : <GraduationCap className="h-4 w-4 text-primary" />
                        }
                      </div>
                      <span className="flex-1 text-[14px] font-bold">{fac.name}</span>
                      <CaretRight className="h-4 w-4 text-muted-foreground/30" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── STEP 3: Year + Semester ── */}
          {step === 3 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <button onClick={() => setStep(hasFaculties ? 2 : 1)} className="mb-6 flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-white/20 hover:text-white transition-colors">
                <ArrowLeft className="h-3 w-3" /> Back
              </button>
              <h1 className="mb-1 font-display text-2xl font-black tracking-tight text-white">Academic Year</h1>
              <p className="mb-8 text-[13px] text-white/35 font-medium">Select your current stage of study.</p>

              <div className="grid grid-cols-3 gap-3 mb-8">
                {filteredYears.map(year => (
                  <button key={year.id}
                    onClick={() => { setSelectedYear(year); setSelectedSem(null); }}
                    className={cn(
                      "flex flex-col items-center justify-center rounded-2xl border p-4 text-center transition-all hover:border-primary/20 active:scale-[0.98]",
                      selectedYear?.id === year.id ? "border-primary bg-primary/5 shadow-inner shadow-primary/10" : "border-white/[0.07] bg-[#131220]"
                    )}>
                    <Calendar className={cn("mb-2 h-4 w-4", selectedYear?.id === year.id ? "text-primary" : "text-white/10")} />
                    <span className={cn("text-[12px] font-bold", selectedYear?.id === year.id ? "text-white" : "text-white/40")}>Year {year.yearNumber}</span>
                  </button>
                ))}
              </div>

              {selectedYear && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                  <p className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-white/20 ml-1">Select Semester</p>
                  <div className="space-y-2.5">
                    {filteredSems.map(sem => (
                      <button key={sem.id}
                        onClick={() => setSelectedSem(sem)}
                        className={cn(
                          "flex w-full items-center justify-between rounded-2xl border p-5 text-left transition-all hover:border-primary/20 active:scale-[0.98]",
                          selectedSem?.id === sem.id ? "border-primary bg-primary/5" : "border-white/[0.07] bg-[#131220]"
                        )}>
                        <div className="flex items-center gap-4">
                          <BookOpen className={cn("h-5 w-5", selectedSem?.id === sem.id ? "text-primary" : "text-white/10")} />
                          <span className={cn("text-[14px] font-bold", selectedSem?.id === sem.id ? "text-white" : "text-white/40")}>{sem.name}</span>
                        </div>
                        {selectedSem?.id === sem.id && <CheckCircle2 className="h-5 w-5 text-primary" />}
                      </button>
                    ))}
                  </div>

                  {selectedSem && (
                    <button onClick={() => setStep(4)}
                      className="mt-10 flex w-full items-center justify-center gap-2 rounded-2xl btn-gradient py-5 text-sm font-black uppercase tracking-wider text-white shadow-2xl shadow-primary/20 transition-all hover:opacity-90 active:scale-[0.98]">
                      Continue <CaretRight className="h-4 w-4" />
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── STEP 4: Telegram Identity ── */}
          {step === 4 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <button onClick={() => setStep(3)} className="mb-6 flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-white/20 hover:text-white transition-colors">
                <ArrowLeft className="h-3 w-3" /> Back
              </button>

              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <PaperPlaneTilt size={32} className="text-blue-500" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">Telegram Identity</h2>
                  <p className="text-zinc-400">Link your account to our Telegram bot for personalized study help.</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-zinc-400 mb-1.5 block">Telegram Phone Number</label>
                    <div className="relative group">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 transition-colors group-focus-within:text-blue-500" size={20} />
                      <input
                        type="tel"
                        value={telegramPhone}
                        onChange={(e) => setTelegramPhone(e.target.value)}
                        placeholder="+2010..."
                        className="w-full bg-zinc-900/50 border border-zinc-800 text-white rounded-xl py-3.5 pl-12 pr-4 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-zinc-600"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-4 py-4 border-y border-white/5">
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-black">Verify with Telegram</p>
                    <div className="min-h-[40px] flex items-center justify-center overflow-hidden rounded-xl">
                      <div id="telegram-login-container"></div>
                      <TelegramWidgetWrapper onAuth={(user) => {
                        setTelegramPhone(user.username || user.first_name);
                        setVCodeVerified(true);
                        setStep(5);
                      }} />
                    </div>
                  </div>

                  <button
                    onClick={() => setStep(5)}
                    className="w-full flex items-center justify-center gap-2 rounded-2xl bg-white/5 border border-white/5 py-5 text-sm font-black uppercase tracking-wider text-white transition-all hover:bg-white/10 active:scale-[0.98]"
                  >
                    Skip for Now <CaretRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 5: Profile ── */}
          {step === 5 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <button onClick={() => setStep(4)} className="mb-6 flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-white/20 hover:text-white transition-colors">
                <ArrowLeft className="h-3 w-3" /> Back
              </button>
              <h1 className="mb-1 font-display text-2xl font-black tracking-tight text-white">Final Setup</h1>
              <p className="mb-8 text-[13px] text-white/35 font-medium">Complete your identity on the platform.</p>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 ml-1">Username *</label>
                  <input value={nickname} onChange={e => setNickname(e.target.value)} placeholder="e.g. ahmed_m" maxLength={30}
                    className="w-full rounded-2xl border border-white/[0.07] bg-[#131220] px-5 py-4 text-sm font-bold text-white outline-none transition-all focus:border-primary/40 focus:ring-4 focus:ring-primary/5 placeholder:text-white/10" />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 ml-1">Student ID *</label>
                  <input value={studentId} onChange={e => setStudentId(e.target.value)} placeholder="Official student number" maxLength={24}
                    className="w-full rounded-2xl border border-white/[0.07] bg-[#131220] px-5 py-4 text-sm font-bold text-white outline-none transition-all focus:border-primary/40 focus:ring-4 focus:ring-primary/5 placeholder:text-white/10" />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 ml-1">Short Bio (Optional)</label>
                  <textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="A bit about yourself..." maxLength={160}
                    className="w-full rounded-2xl border border-white/[0.07] bg-[#131220] px-5 py-4 text-sm font-bold text-white outline-none transition-all focus:border-primary/40 focus:ring-4 focus:ring-primary/5 placeholder:text-white/10 resize-none h-24" />
                </div>

                <button onClick={handleFinish} disabled={saving}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl btn-gradient py-5 text-sm font-black uppercase tracking-wider text-white shadow-2xl shadow-primary/20 transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50">
                  {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkle className="h-5 w-5" />}
                  {saving ? "Finalizing..." : "Join MedOneX"}
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 6: Success ── */}
          {step === 6 && (
            <div className="animate-in zoom-in-95 duration-700 flex flex-col items-center py-12 text-center">
              <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-3xl bg-primary/10 text-primary shadow-inner">
                <CheckCircle2 className="h-12 w-12" />
              </div>
              <h1 className="mb-3 font-display text-3xl font-black tracking-tight text-white">You're in! 🎉</h1>
              <p className="mb-10 text-[15px] leading-relaxed text-white/35 max-w-[280px]">
                Your medical journey begins now. Redirecting to your dashboard...
              </p>
              <div className="h-[2px] w-48 overflow-hidden rounded-full bg-muted">
                <div className="h-full animate-progress rounded-full bg-primary" />
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        @keyframes progress {
          from { width: 0%; }
          to { width: 100%; }
        }
        .animate-progress {
          animation: progress 2.2s linear forwards;
        }
      `}</style>
    </div>
  );
}

function TelegramWidgetWrapper({ onAuth }: { onAuth: (user: any) => void }) {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.setAttribute('data-telegram-login', 'MedQsBot');
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-request-access', 'write');
    script.setAttribute('data-userpic', 'false');
    script.async = true;

    // Callback function in window
    (window as any).onTelegramAuth = (user: any) => {
      onAuth(user);
    };
    script.setAttribute('data-onauth', 'onTelegramAuth(user)');

    const container = document.getElementById('telegram-login-container');
    if (container) container.appendChild(script);

    return () => {
      if (container) {
        container.innerHTML = '';
      }
      delete (window as any).onTelegramAuth;
    };
  }, [onAuth]);

  return null;
}

