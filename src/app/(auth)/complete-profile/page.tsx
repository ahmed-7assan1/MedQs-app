"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  User, Building2, GraduationCap, Calendar, BookOpen,
  Lock, Loader2, CheckCircle, Eye, EyeOff, ArrowLeft,
} from "lucide-react";
import { CaretUpDown } from "@phosphor-icons/react";
import { NewAuthShell } from "@/components/auth/NewAuthShell";
import { MedicalCinematicBg } from "@/components/auth/MedicalCinematicBg";
import toast from "react-hot-toast";
import { unwrapApiList } from "@/lib/api-list";
import { cn } from "@/lib/utils";

const ease = [0.22, 1, 0.36, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: (i: number = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.5, ease, delay: i * 0.06 },
  }),
};

function CustomDropdown({ label, options, value, onChange, icon: Icon, disabled, placeholder }: any) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <motion.div variants={fadeUp} custom={3} className="space-y-1.5 relative">
      <label className="text-xs font-medium text-foreground/80">{label}</label>
      <button type="button" disabled={disabled} onClick={() => setIsOpen(!isOpen)}
        className={cn("flex h-11 w-full items-center justify-between gap-2 rounded-xl border bg-background px-4 text-sm shadow-sm transition-all",
          isOpen ? "border-primary ring-4 ring-primary/10" : "border-border hover:border-foreground/20",
          disabled && "opacity-40 cursor-not-allowed")}>
        <div className="flex items-center gap-2.5 overflow-hidden">
          <Icon className={cn("h-4 w-4 shrink-0", value ? "text-primary" : "text-muted-foreground")} />
          <span className={cn("truncate", value ? "text-foreground font-medium" : "text-muted-foreground/60")}>
            {value ? (options.find((o: any) => o.id === value.id)?.name || value.name) : placeholder}
          </span>
        </div>
        <CaretUpDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0, y: 8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.95 }}
            className="absolute z-[100] left-0 right-0 mt-1.5 p-1.5 bg-card border border-border rounded-xl shadow-2xl backdrop-blur-md max-h-[200px] overflow-y-auto custom-scrollbar">
            {options.length === 0 ? (
              <div className="py-6 text-center text-xs text-muted-foreground">No options found</div>
            ) : options.map((opt: any) => (
              <button key={opt.id} type="button" onClick={() => { onChange(opt); setIsOpen(false); }}
                className={cn("w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left",
                  value?.id === opt.id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted")}>
                {opt.name || `Year ${opt.yearNumber}`}
                {value?.id === opt.id && <CheckCircle size={14} className="ml-auto text-primary" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function FormField({ icon: Icon, type, value, onChange, placeholder, showToggle, onToggle, rightElement }: any) {
  return (
    <motion.div variants={fadeUp} custom={3} className="flex flex-col gap-1.5">
      <div className="group relative">
        <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" strokeWidth={2} />
        <input type={type} required value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
          className="h-11 w-full rounded-xl border border-border bg-background pl-10 pr-10 text-sm shadow-sm transition-all placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10" />
        {showToggle && (
          <button type="button" onClick={onToggle}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:text-foreground">
            {showToggle === "eye-off" ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
        {rightElement}
      </div>
    </motion.div>
  );
}

function CompleteProfileContent() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);

  const [unis, setUnis] = useState<any[]>([]);
  const [faculties, setFaculties] = useState<any[]>([]);
  const [years, setYears] = useState<any[]>([]);
  const [semesters, setSemesters] = useState<any[]>([]);
  const [selUni, setSelUni] = useState<any>(null);
  const [selFac, setSelFac] = useState<any>(null);
  const [selYear, setSelYear] = useState<any>(null);
  const [selSem, setSelSem] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.replace("/auth?mode=login"); return; }
      if (user.user_metadata?.onboarding_completed) { router.replace("/dashboard-app"); return; }
      setFullName(user.user_metadata?.name || "");
      setPageLoading(false);
    });
    fetch("/api/v1/universities").then(r => r.ok ? r.json() : { data: [] }).then(d => setUnis(unwrapApiList(d))).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selUni) { setSelFac(null); setSelYear(null); setSelSem(null); setFaculties([]); setYears([]); setSemesters([]); return; }
    setSelFac(null); setSelYear(null); setSelSem(null); setFaculties([]); setYears([]); setSemesters([]);
    fetch(`/api/v1/faculties?universityId=${selUni.id}`).then(r => r.json()).then(d => setFaculties(unwrapApiList(d)));
  }, [selUni]);
  useEffect(() => {
    if (!selFac) { setSelYear(null); setSelSem(null); setYears([]); setSemesters([]); return; }
    setSelYear(null); setSelSem(null); setYears([]); setSemesters([]);
    fetch(`/api/v1/academic-years?universityId=${selUni?.id}&facultyId=${selFac.id}`).then(r => r.json()).then(d => setYears(unwrapApiList(d)));
  }, [selFac]);
  useEffect(() => {
    if (!selYear) { setSelSem(null); setSemesters([]); return; }
    setSelSem(null); setSemesters([]);
    fetch(`/api/v1/semesters?academicYearId=${selYear.id}`).then(r => r.json()).then(d => setSemesters(unwrapApiList(d)));
  }, [selYear]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !selUni || !selFac || !selYear || !selSem || !password || !confirmPassword) {
      return toast.error("Please complete all fields.");
    }
    if (password.length < 6) return toast.error("Password must be at least 6 characters.");
    if (password !== confirmPassword) return toast.error("Passwords do not match.");
    setLoading(true);
    try {
      const { error: pwError } = await supabase.auth.updateUser({ password });
      if (pwError) throw pwError;
      const { error: metaError } = await supabase.auth.updateUser({
        data: {
          name: fullName,
          universityId: selUni.id,
          facultyId: selFac.id,
          semesterId: selSem.id,
          onboarding_completed: true
        }
      });
      if (metaError) throw metaError;
      document.cookie = `remember_me=${rememberMe}; path=/; max-age=${rememberMe ? 31536000 : 0}; SameSite=Lax`;
      await fetch("/api/v1/auth/sync", { method: "POST" });
      toast.success("Profile completed!");
      window.location.href = "/dashboard-app";
    } catch (err: any) {
      toast.error(err.message || "Something went wrong.");
    } finally { setLoading(false); }
  };

  if (pageLoading) {
    return (
      <div className="relative flex min-h-screen items-center justify-center">
        <MedicalCinematicBg />
        <Loader2 className="h-6 w-6 animate-spin text-primary z-10" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <MedicalCinematicBg />
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease }}
        className="relative z-30 mx-auto flex max-w-7xl items-center justify-between px-6 py-5"
      >
        <Link href="/" className="flex items-center gap-2 text-[15px] font-bold tracking-tight text-foreground">
          Complete Profile
        </Link>
        <Link href="/auth?mode=login" className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium shadow-sm transition-all hover:shadow-md">
          <ArrowLeft className="h-4 w-4" /> Back to login
        </Link>
      </motion.header>

      <main className="relative z-10 mx-auto flex max-w-7xl items-center justify-center px-6 pb-20 pt-6 md:pt-10">
        <motion.div variants={fadeUp} initial="hidden" animate="show" custom={1} className="w-full max-w-md">
          <div className="rounded-3xl border border-border bg-card/90 p-8 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.4)] backdrop-blur-sm sm:p-10">
            <motion.p variants={fadeUp} custom={2} className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              Setup
            </motion.p>
            <motion.h1 variants={fadeUp} custom={3} className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Complete Your Profile
            </motion.h1>
            <motion.p variants={fadeUp} custom={4} className="mt-2 text-sm text-muted-foreground">
              Set up your academic profile to get started.
            </motion.p>
            <motion.div variants={fadeUp} custom={5} className="mt-8">
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <FormField icon={User} type="text" value={fullName} onChange={setFullName} placeholder="Full Name" />

                <CustomDropdown label="University" options={unis} value={selUni} onChange={setSelUni} icon={Building2} placeholder="Select University" />
                {selUni && <CustomDropdown label="Faculty" options={faculties} value={selFac} onChange={setSelFac} icon={GraduationCap} placeholder="Select Faculty" />}
                {selFac && (
                  <div className="grid grid-cols-2 gap-3">
                    <CustomDropdown label="Year" options={years} value={selYear} onChange={setSelYear} icon={Calendar} placeholder="Select Year" />
                    <CustomDropdown label="Semester" options={semesters} value={selSem} onChange={setSelSem} icon={BookOpen} placeholder="Select Semester" />
                  </div>
                )}

                <div className="border-t border-border pt-4 space-y-3">
                  <FormField icon={Lock} type={showPassword ? "text" : "password"} value={password} onChange={setPassword} placeholder="Password"
                    showToggle={showPassword ? "eye-off" : "eye"} onToggle={() => setShowPassword(!showPassword)} />
                  <FormField icon={Lock} type="password" value={confirmPassword} onChange={setConfirmPassword} placeholder="Confirm Password"
                    showToggle={showConfirm ? "eye-off" : "eye"} onToggle={() => setShowConfirm(!showConfirm)} />
                </div>

                <motion.label variants={fadeUp} custom={6} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)}
                    className="h-3.5 w-3.5 rounded border-border bg-background accent-primary" />
                  <span className="text-sm text-muted-foreground">Remember me — stay logged in on this device</span>
                </motion.label>

                <motion.button type="submit" disabled={loading}
                  whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.15, ease }}
                  className="group mt-2 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-foreground px-5 text-sm font-semibold text-background shadow-[0_10px_30px_-10px_rgba(0,0,0,0.6)] transition-all hover:bg-foreground/90 disabled:opacity-50">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Complete Profile"}
                </motion.button>
              </form>
            </motion.div>
          </div>
        </motion.div>
      </main>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: hsl(var(--border)); border-radius: 20px; }
      `}</style>
    </div>
  );
}

export default function CompleteProfilePage() {
  return (
    <Suspense fallback={<div className="relative min-h-screen flex items-center justify-center"><MedicalCinematicBg /><Loader2 className="h-6 w-6 animate-spin text-primary z-10" /></div>}>
      <CompleteProfileContent />
    </Suspense>
  );
}
