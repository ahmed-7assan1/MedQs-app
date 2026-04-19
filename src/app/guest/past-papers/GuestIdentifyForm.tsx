"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, GraduationCap, School, BookOpen, User, ChevronRight, ChevronLeft } from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

export function GuestIdentifyForm() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [displayName, setDisplayName] = useState("");
  const [externalStudentId, setExternalStudentId] = useState("");
  const [universityId, setUniversityId] = useState("");
  const [facultyId, setFacultyId] = useState("");
  const [academicYearId, setAcademicYearId] = useState("");
  const [semesterId, setSemesterId] = useState("");
  const [busy, setBusy] = useState(false);

  const [hierarchy, setHierarchy] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/v1/guest-quiz/academic-hierarchy")
      .then((res) => res.json())
      .then((data) => {
        setHierarchy(Array.isArray(data) ? data : []);
      })
      .finally(() => setLoading(false));
  }, []);

  const selectedUni = hierarchy.find((u) => u.id === universityId);
  const selectedFac = selectedUni?.faculties?.find((f: any) => f.id === facultyId);
  const selectedYear = selectedFac?.academicYears?.find((y: any) => y.id === academicYearId);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!semesterId) return toast.error("Please complete all selections");
    setBusy(true);
    try {
      const res = await fetch("/api/v1/guest-quiz/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName, externalStudentId, universityId, facultyId, semesterId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(typeof data?.error === "string" ? data.error : "Could not continue");
        return;
      }
      toast.success("Welcome! Your portal is ready.");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading academic portal...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl overflow-hidden rounded-3xl border border-border bg-card shadow-2xl">
      <div className="bg-primary/5 p-6 md:p-8">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold">Guest Quiz Portal</h1>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
              Step {step} of 2
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 md:p-8">
        <form onSubmit={onSubmit} className="space-y-6">
          {step === 1 ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    <User className="h-3.5 w-3.5" />
                    Full Name
                  </label>
                  <input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 transition-all"
                    placeholder="Enter your name"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    <BookOpen className="h-3.5 w-3.5" />
                    Student ID
                  </label>
                  <input
                    value={externalStudentId}
                    onChange={(e) => setExternalStudentId(e.target.value)}
                    className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 transition-all"
                    placeholder="ID / National ID"
                    required
                  />
                </div>
              </div>

              <div className="space-y-4 rounded-2xl bg-muted/30 p-4 border border-border/50">
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    <School className="h-3.5 w-3.5" />
                    University
                  </label>
                  <select
                    value={universityId}
                    onChange={(e) => {
                      setUniversityId(e.target.value);
                      setFacultyId("");
                      setAcademicYearId("");
                      setSemesterId("");
                    }}
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm"
                    required
                  >
                    <option value="">Select University</option>
                    {hierarchy.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Faculty / College
                  </label>
                  <select
                    value={facultyId}
                    onChange={(e) => {
                      setFacultyId(e.target.value);
                      setAcademicYearId("");
                      setSemesterId("");
                    }}
                    disabled={!universityId}
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm disabled:opacity-40"
                    required
                  >
                    <option value="">Select Faculty</option>
                    {selectedUni?.faculties?.map((f: any) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={!displayName || !externalStudentId || !universityId || !facultyId}
                className="btn btn-primary group flex w-full items-center justify-center gap-2 py-3 disabled:opacity-40"
              >
                Next Step
                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-2 duration-500">
              <div className="rounded-2xl bg-primary/5 p-4 ring-1 ring-primary/10">
                <p className="text-xs font-medium text-primary">Selected Academic Path</p>
                <p className="mt-1 text-sm font-bold truncate">
                  {selectedUni?.name} • {selectedFac?.name}
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Academic Year
                  </label>
                  <select
                    value={academicYearId}
                    onChange={(e) => {
                      setAcademicYearId(e.target.value);
                      setSemesterId("");
                    }}
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm"
                    required
                  >
                    <option value="">Select Year</option>
                    {selectedFac?.academicYears?.map((y: any) => (
                      <option key={y.id} value={y.id}>
                        Year {y.yearNumber}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Semester
                  </label>
                  <select
                    value={semesterId}
                    onChange={(e) => setSemesterId(e.target.value)}
                    disabled={!academicYearId}
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm disabled:opacity-40"
                    required
                  >
                    <option value="">Select Semester</option>
                    {selectedYear?.semesters?.map((s: any) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-background hover:bg-muted transition-colors"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="submit"
                  disabled={busy || !semesterId}
                  className="btn btn-primary flex-1 flex items-center justify-center gap-2 py-3 disabled:opacity-50"
                >
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Enter Portal
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

