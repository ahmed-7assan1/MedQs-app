"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Building2, Calendar, BookOpen, ChevronRight, Loader2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface University { id: string; name: string; logoUrl?: string }
interface AcademicYear { id: string; yearNumber: number; universityId: string }
interface Semester { id: string; name: string; academicYearId: string }

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [universities, setUniversities] = useState<University[]>([]);
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [selectedUni, setSelectedUni] = useState<University | null>(null);
  const [selectedYear, setSelectedYear] = useState<AcademicYear | null>(null);
  const [selectedSem, setSelectedSem] = useState<Semester | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/v1/universities");
        const data = r.ok ? await r.json() : [];
        setUniversities(Array.isArray(data) ? data : []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!selectedUni) return;
    (async () => {
      const r = await fetch("/api/v1/academic-years");
      const data = r.ok ? await r.json() : [];
      const list = Array.isArray(data) ? data : [];
      setYears(list.filter((y: AcademicYear) => y.universityId === selectedUni.id));
    })();
  }, [selectedUni]);

  useEffect(() => {
    if (!selectedYear) return;
    (async () => {
      const r = await fetch("/api/v1/semesters");
      const data = r.ok ? await r.json() : [];
      const list = Array.isArray(data) ? data : [];
      setSemesters(list.filter((s: Semester) => s.academicYearId === selectedYear.id));
    })();
  }, [selectedYear]);

  async function handleFinish() {
    if (!selectedUni || !selectedSem) return;
    setSaving(true);
    try {
      const res = await fetch("/api/v1/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          universityId: selectedUni.id,
          semesterId: selectedSem.id,
        }),
      });
      if (res.ok) {
        toast.success("Welcome to MedQs! 🎉");
        router.push("/dashboard");
        router.refresh();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(typeof err?.error === "string" ? err.error : "Something went wrong, please try again.");
      }
    } finally {
      setSaving(false);
    }
  }

  const steps = [
    { n: 1, label: "University" },
    { n: 2, label: "Year" },
    { n: 3, label: "Semester" },
  ];

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-4 py-12">
      <div
        className="pointer-events-none absolute inset-0 opacity-90"
        style={{
          background:
            "radial-gradient(ellipse 90% 55% at 10% -10%, hsl(var(--primary) / 0.14), transparent 50%), radial-gradient(ellipse 70% 50% at 100% 0%, hsl(240 60% 50% / 0.08), transparent 45%)",
        }}
        aria-hidden
      />
      {/* Logo */}
      <div className="relative mb-8 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-xl shadow-primary/20 ring-2 ring-primary/15">
          <span className="font-display text-xl font-bold">M</span>
        </div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary/90">Onboarding</p>
        <h1 className="mt-2 font-display text-2xl font-bold tracking-tight">Almost there</h1>
        <p className="mt-1 max-w-md text-sm leading-relaxed text-muted-foreground">
          Link your university and semester so lectures, papers, and forums match your cohort.
        </p>
      </div>

      {/* Step indicator */}
      <div className="relative mb-8 flex items-center gap-2">
        {steps.map(({ n, label }, i) => (
          <div key={n} className="flex items-center gap-2">
            <div className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all",
              step > n ? "bg-primary text-primary-foreground" :
              step === n ? "bg-primary text-primary-foreground ring-4 ring-primary/20" :
              "bg-muted text-muted-foreground"
            )}>
              {step > n ? <CheckCircle2 className="h-4 w-4" /> : n}
            </div>
            <span className={cn("hidden text-xs sm:block", step === n ? "font-medium" : "text-muted-foreground")}>{label}</span>
            {i < steps.length - 1 && <div className={cn("h-0.5 w-8 rounded transition-colors", step > n ? "bg-primary" : "bg-muted")} />}
          </div>
        ))}
      </div>

      <div className="relative w-full max-w-md">
        {/* Step 1 — University */}
        {step === 1 && (
          <div className="animate-fade-in">
            <h2 className="mb-1 font-display text-xl font-bold">Select your university</h2>
            <p className="mb-5 text-sm text-muted-foreground">Choose the institution you're enrolled in.</p>
            {loading ? (
              <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : universities.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
                No universities set up yet. Please ask your admin.
              </div>
            ) : (
              <div className="space-y-2">
                {universities.map((uni) => (
                  <button
                    key={uni.id}
                    onClick={() => { setSelectedUni(uni); setSelectedYear(null); setSelectedSem(null); setStep(2); }}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl border px-4 py-3.5 text-left transition-all hover:border-primary/50 hover:bg-primary/5 active:scale-[0.98]",
                      selectedUni?.id === uni.id ? "border-primary bg-primary/10" : "border-border bg-card"
                    )}
                  >
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      {uni.logoUrl
                        ? <img src={uni.logoUrl} alt={uni.name} className="h-8 w-8 rounded object-contain" />
                        : <Building2 className="h-5 w-5 text-primary" />
                      }
                    </div>
                    <span className="flex-1 font-medium">{uni.name}</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 2 — Academic Year */}
        {step === 2 && (
          <div className="animate-fade-in">
            <button onClick={() => setStep(1)} className="mb-4 text-xs text-muted-foreground hover:text-foreground transition-colors">
              ← Back
            </button>
            <h2 className="mb-1 font-display text-xl font-bold">Select your year</h2>
            <p className="mb-5 text-sm text-muted-foreground">Which year of study are you in at {selectedUni?.name}?</p>
            {years.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
                No years configured yet. Please ask your admin.
              </div>
            ) : (
              <div className="space-y-2">
                {years.map((year) => (
                  <button
                    key={year.id}
                    onClick={() => { setSelectedYear(year); setSelectedSem(null); setStep(3); }}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl border px-4 py-3.5 text-left transition-all hover:border-primary/50 hover:bg-primary/5 active:scale-[0.98]",
                      selectedYear?.id === year.id ? "border-primary bg-primary/10" : "border-border bg-card"
                    )}
                  >
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
                      <Calendar className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <span className="flex-1 font-medium">Year {year.yearNumber}</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 3 — Semester */}
        {step === 3 && (
          <div className="animate-fade-in">
            <button onClick={() => setStep(2)} className="mb-4 text-xs text-muted-foreground hover:text-foreground transition-colors">
              ← Back
            </button>
            <h2 className="mb-1 font-display text-xl font-bold">Select your semester</h2>
            <p className="mb-5 text-sm text-muted-foreground">Year {selectedYear?.yearNumber} — {selectedUni?.name}</p>
            {semesters.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
                No semesters configured for this year.
              </div>
            ) : (
              <div className="space-y-2">
                {semesters.map((sem) => (
                  <button
                    key={sem.id}
                    onClick={() => setSelectedSem(sem)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl border px-4 py-3.5 text-left transition-all hover:border-primary/50 hover:bg-primary/5 active:scale-[0.98]",
                      selectedSem?.id === sem.id ? "border-primary bg-primary/10" : "border-border bg-card"
                    )}
                  >
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900/30">
                      <BookOpen className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                    </div>
                    <span className="flex-1 font-medium">{sem.name}</span>
                    {selectedSem?.id === sem.id && <CheckCircle2 className="h-5 w-5 text-primary" />}
                  </button>
                ))}
              </div>
            )}

            {selectedSem && (
              <button
                onClick={handleFinish}
                disabled={saving}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-all active:scale-[0.98]"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {saving ? "Setting up your account..." : "Start learning →"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
