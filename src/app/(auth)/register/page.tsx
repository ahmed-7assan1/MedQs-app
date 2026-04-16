"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Building2, Calendar, BookOpen, ChevronRight, Loader2, CheckCircle2,
  User, Phone, FileText, ArrowLeft, Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MedQsLogoMark } from "@/components/branding/MedQsLogo";
import toast from "react-hot-toast";
import { unwrapApiList } from "@/lib/api-list";

interface University  { id: string; name: string; logoUrl?: string }
interface AcademicYear { id: string; yearNumber: number; universityId: string }
interface Semester     { id: string; name: string; academicYearId: string }

type Step = 1 | 2 | 3 | 4;

const STEP_META = [
  { n: 1, label: "University" },
  { n: 2, label: "Year & Semester" },
  { n: 3, label: "Your Profile" },
  { n: 4, label: "Done!" },
];

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);

  // Data
  const [universities, setUniversities] = useState<University[]>([]);
  const [years,        setYears]        = useState<AcademicYear[]>([]);
  const [semesters,    setSemesters]    = useState<Semester[]>([]);

  // Selections
  const [selectedUni,  setSelectedUni]  = useState<University | null>(null);
  const [selectedYear, setSelectedYear] = useState<AcademicYear | null>(null);
  const [selectedSem,  setSelectedSem]  = useState<Semester | null>(null);

  // Profile fields
  const [nickname,   setNickname]   = useState("");
  const [studentId,  setStudentId]  = useState("");
  const [bio,        setBio]        = useState("");
  const [phone,      setPhone]      = useState("");

  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);

  // Load universities once
  useEffect(() => {
    (async () => {
      try {
        const r    = await fetch("/api/v1/universities");
        const data = r.ok ? await r.json() : [];
        setUniversities(Array.isArray(data) ? data : []);
      } finally { setLoading(false); }
    })();
  }, []);

  // Load years when uni selected
  useEffect(() => {
    if (!selectedUni) return;
    (async () => {
      const r    = await fetch("/api/v1/academic-years");
      const data = r.ok ? await r.json() : [];
      setYears(unwrapApiList<AcademicYear>(data).filter(y => y.universityId === selectedUni.id));
    })();
  }, [selectedUni]);

  // Load semesters when year selected
  useEffect(() => {
    if (!selectedYear) return;
    (async () => {
      const r    = await fetch("/api/v1/semesters");
      const data = r.ok ? await r.json() : [];
      setSemesters(unwrapApiList<Semester>(data).filter(s => s.academicYearId === selectedYear.id));
    })();
  }, [selectedYear]);

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
      const res = await fetch("/api/v1/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          universityId: selectedUni.id,
          semesterId: selectedSem.id,
          nickname: nick,
          studentId: sid,
          ...(bio.trim()   ? { bio: bio.trim() }     : {}),
          ...(phone.trim() ? { phone: phone.trim() } : {}),
        }),
      });

      if (res.ok) {
        setStep(4);
        setTimeout(() => {
          router.push("/dashboard");
          router.refresh();
        }, 2200);
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(typeof err?.error === "string" ? err.error : "Something went wrong.");
      }
    } finally { setSaving(false); }
  }

  // ── helpers ─────────────────────────────────────────────────────────────────
  const filteredYears = years.filter(y => y.universityId === selectedUni?.id);
  const filteredSems  = semesters.filter(s => s.academicYearId === selectedYear?.id);

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-white dark:bg-[#080c14]">

      {/* ── LEFT PANEL ── */}
      <div className="relative hidden flex-col justify-between overflow-hidden lg:flex lg:w-[380px] xl:w-[420px]"
        style={{ background: "linear-gradient(145deg, #0f1729 0%, #111827 60%, #0c1320 100%)" }}>
        {/* Grid */}
        <div className="absolute inset-0 opacity-[0.06]"
          style={{ backgroundImage: "linear-gradient(rgba(100,150,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(100,150,255,1) 1px, transparent 1px)", backgroundSize: "50px 50px" }} />
        {/* Glow */}
        <div className="absolute -top-1/4 -left-1/4 h-3/4 w-3/4 rounded-full blur-[140px]"
          style={{ background: "radial-gradient(circle, rgba(26,107,204,0.2) 0%, transparent 60%)" }} />
        <div className="absolute -bottom-1/4 -right-1/4 h-2/3 w-2/3 rounded-full blur-[120px]"
          style={{ background: "radial-gradient(circle, rgba(107,72,204,0.12) 0%, transparent 60%)" }} />

        <div className="relative z-10 p-10">
          <div className="flex items-center gap-3">
            <span style={{ filter: "brightness(0) invert(1)" }}>
              <MedQsLogoMark className="h-9 w-9" title="MedQs" />
            </span>
            <span className="text-lg font-bold text-white">MedQs</span>
          </div>
        </div>

        <div className="relative z-10 px-10 pb-10">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-blue-400">Onboarding</p>
          <h2 className="mb-4 font-display text-2xl font-extrabold leading-tight text-white">
            Set up your<br />
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              academic profile
            </span>
          </h2>
          <p className="mb-8 text-sm leading-relaxed text-white/50">
            Once set up, your dashboard will show only content relevant to your university, year, and semester.
          </p>

          {/* Step progress */}
          <div className="space-y-3">
            {STEP_META.map(({ n, label }) => (
              <div key={n} className="flex items-center gap-3">
                <div className={cn(
                  "flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all",
                  step > n  ? "bg-green-500 text-white" :
                  step === n ? "bg-blue-500 text-white ring-4 ring-blue-500/20" :
                  "bg-white/10 text-white/40"
                )}>
                  {step > n ? <CheckCircle2 className="h-3.5 w-3.5" /> : n}
                </div>
                <span className={cn("text-sm transition-colors",
                  step === n ? "font-semibold text-white" :
                  step > n   ? "text-green-400" :
                  "text-white/40"
                )}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL (form) ── */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
        {/* Mobile progress */}
        <div className="mb-8 flex items-center gap-2 lg:hidden">
          {STEP_META.map(({ n }, i) => (
            <div key={n} className="flex items-center gap-2">
              <div className={cn("h-2 w-8 rounded-full transition-all",
                step > n ? "bg-green-500" : step === n ? "bg-blue-500" : "bg-muted")} />
            </div>
          ))}
        </div>

        <div className="w-full max-w-[400px]">

          {/* ── STEP 1: University ── */}
          {step === 1 && (
            <div className="animate-fade-in">
              <p className="mb-1 text-xs font-bold uppercase tracking-widest text-blue-500">Step 1 of 3</p>
              <h1 className="mb-1 font-display text-2xl font-extrabold text-foreground">Choose your university</h1>
              <p className="mb-6 text-sm text-muted-foreground">Your content will be personalized based on your institution.</p>

              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                </div>
              ) : universities.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border py-12 text-center">
                  <Building2 className="mx-auto mb-3 h-8 w-8 text-muted-foreground opacity-40" />
                  <p className="font-medium text-foreground">No universities set up yet</p>
                  <p className="text-sm text-muted-foreground">Please ask your administrator.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {universities.map(uni => (
                    <button key={uni.id}
                      onClick={() => { setSelectedUni(uni); setSelectedYear(null); setSelectedSem(null); setStep(2); }}
                      className={cn(
                        "flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98]",
                        selectedUni?.id === uni.id
                          ? "border-blue-500/50 bg-blue-500/8 dark:bg-blue-500/10"
                          : "border-border/60 bg-card hover:border-blue-500/30 dark:bg-white/3"
                      )}>
                      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl"
                        style={{ background: "rgba(26,107,204,0.1)", borderLeft: "3px solid #1A6BCC" }}>
                        {uni.logoUrl
                          ? <img src={uni.logoUrl} alt={uni.name} className="h-9 w-9 rounded-lg object-contain" />
                          : <Building2 className="h-5 w-5 text-blue-500" />
                        }
                      </div>
                      <span className="flex-1 font-semibold text-foreground">{uni.name}</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── STEP 2: Year + Semester ── */}
          {step === 2 && (
            <div className="animate-fade-in">
              <button onClick={() => setStep(1)} className="mb-5 flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground">
                <ArrowLeft className="h-3.5 w-3.5" /> Back
              </button>
              <p className="mb-1 text-xs font-bold uppercase tracking-widest text-blue-500">Step 2 of 3</p>
              <h1 className="mb-1 font-display text-2xl font-extrabold text-foreground">Your academic year</h1>
              <p className="mb-6 text-sm text-muted-foreground">{selectedUni?.name}</p>

              {/* Years */}
              <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Academic Year</p>
              {filteredYears.length === 0 ? (
                <div className="mb-4 rounded-xl border border-dashed border-border py-6 text-center text-sm text-muted-foreground">
                  No years configured yet.
                </div>
              ) : (
                <div className="mb-5 grid grid-cols-3 gap-2">
                  {filteredYears.map(year => (
                    <button key={year.id}
                      onClick={() => { setSelectedYear(year); setSelectedSem(null); }}
                      className={cn(
                        "flex flex-col items-center rounded-xl border p-3 text-center transition-all hover:-translate-y-0.5 active:scale-[0.98]",
                        selectedYear?.id === year.id
                          ? "border-amber-500/50 bg-amber-500/8 dark:bg-amber-500/10"
                          : "border-border/60 bg-card hover:border-amber-500/30 dark:bg-white/3"
                      )}>
                      <Calendar className={cn("mb-1 h-5 w-5", selectedYear?.id === year.id ? "text-amber-500" : "text-muted-foreground")} />
                      <span className="text-xs font-bold">Year {year.yearNumber}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Semesters */}
              {selectedYear && (
                <>
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Semester</p>
                  {filteredSems.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border py-6 text-center text-sm text-muted-foreground">
                      No semesters configured.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {filteredSems.map(sem => (
                        <button key={sem.id}
                          onClick={() => setSelectedSem(sem)}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-xl border p-3.5 text-left transition-all hover:-translate-y-0.5 active:scale-[0.98]",
                            selectedSem?.id === sem.id
                              ? "border-purple-500/50 bg-purple-500/8 dark:bg-purple-500/10"
                              : "border-border/60 bg-card hover:border-purple-500/30 dark:bg-white/3"
                          )}>
                          <BookOpen className={cn("h-4 w-4 flex-shrink-0", selectedSem?.id === sem.id ? "text-purple-500" : "text-muted-foreground")} />
                          <span className="flex-1 font-medium">{sem.name}</span>
                          {selectedSem?.id === sem.id && <CheckCircle2 className="h-4 w-4 text-purple-500" />}
                        </button>
                      ))}
                    </div>
                  )}

                  {selectedSem && (
                    <button onClick={() => setStep(3)}
                      className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3.5 text-sm font-semibold text-white shadow-[0_6px_20px_rgba(37,99,235,0.35)] transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(37,99,235,0.45)] active:scale-[0.98]">
                      Continue <ChevronRight className="h-4 w-4" />
                    </button>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── STEP 3: Profile ── */}
          {step === 3 && (
            <div className="animate-fade-in">
              <button onClick={() => setStep(2)} className="mb-5 flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground">
                <ArrowLeft className="h-3.5 w-3.5" /> Back
              </button>
              <p className="mb-1 text-xs font-bold uppercase tracking-widest text-blue-500">Step 3 of 3</p>
              <h1 className="mb-1 font-display text-2xl font-extrabold text-foreground">Your profile</h1>
              <p className="mb-6 text-sm text-muted-foreground">This info helps classmates find and recognize you.</p>

              <div className="space-y-4">

                {/* Username */}
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-foreground">
                    <User className="h-3.5 w-3.5 text-blue-500" />
                    Username <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={nickname}
                    onChange={e => setNickname(e.target.value)}
                    placeholder="e.g. ahmed.m"
                    maxLength={30}
                    className="w-full rounded-xl border border-border/60 bg-background/80 px-4 py-3 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:bg-white/5"
                  />
                  <p className="mt-1 text-[11px] text-muted-foreground">Letters, numbers, dot, underscore, dash only</p>
                </div>

                {/* Student ID */}
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-foreground">
                    <FileText className="h-3.5 w-3.5 text-purple-500" />
                    University / Faculty ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={studentId}
                    onChange={e => setStudentId(e.target.value)}
                    placeholder="Your official student number"
                    maxLength={24}
                    className="w-full rounded-xl border border-border/60 bg-background/80 px-4 py-3 text-sm outline-none transition-all focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 dark:bg-white/5"
                  />
                  <p className="mt-1 text-[11px] text-muted-foreground">Min 6 characters</p>
                </div>

                {/* Bio */}
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                    Bio <span className="ml-1 rounded-full bg-muted/60 px-2 py-0.5 text-[10px]">optional</span>
                  </label>
                  <textarea
                    value={bio}
                    onChange={e => setBio(e.target.value)}
                    placeholder="Tell classmates a bit about yourself…"
                    maxLength={200}
                    rows={2}
                    className="w-full resize-none rounded-xl border border-border/60 bg-background/80 px-4 py-3 text-sm outline-none transition-all focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/10 dark:bg-white/5"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                    <Phone className="h-3.5 w-3.5" />
                    Phone number <span className="ml-1 rounded-full bg-muted/60 px-2 py-0.5 text-[10px]">optional · private</span>
                  </label>
                  <input
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+20 10 XXXX XXXX"
                    maxLength={20}
                    type="tel"
                    className="w-full rounded-xl border border-border/60 bg-background/80 px-4 py-3 text-sm outline-none transition-all focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/10 dark:bg-white/5"
                  />
                </div>

                <button
                  onClick={handleFinish}
                  disabled={saving}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3.5 text-sm font-bold text-white shadow-[0_6px_20px_rgba(37,99,235,0.35)] transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(37,99,235,0.45)] active:scale-[0.98] disabled:opacity-60 disabled:translate-y-0"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  {saving ? "Setting up…" : "Complete Setup"}
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 4: Welcome ── */}
          {step === 4 && (
            <div className="animate-fade-in flex flex-col items-center py-8 text-center">
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-emerald-600 shadow-[0_10px_40px_rgba(16,185,129,0.4)]">
                <Sparkles className="h-10 w-10 text-white" />
              </div>
              <h1 className="mb-2 font-display text-2xl font-extrabold text-foreground">Welcome to MedQs! 🎉</h1>
              <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
                Your profile is all set. Taking you to your dashboard…
              </p>
              <div className="h-1.5 w-48 overflow-hidden rounded-full bg-muted">
                <div className="h-full w-full animate-[progress_2.2s_linear_forwards] rounded-full bg-gradient-to-r from-blue-500 to-indigo-500"
                  style={{ animation: "width 2.2s linear forwards" }} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
