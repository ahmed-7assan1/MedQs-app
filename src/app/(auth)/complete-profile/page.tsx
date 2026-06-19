"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import {
  Mail, Lock, User, Building2, GraduationCap, Calendar, BookOpen,
  Loader2, CheckCircle, Eye, EyeOff, Chrome
} from "lucide-react";
import { CaretUpDown } from "@phosphor-icons/react";
import { MedOneXLogoMark } from "@/components/branding/MedQsLogo";
import { MedicalCinematicBg } from "@/components/auth/MedicalCinematicBg";
import toast from "react-hot-toast";
import { unwrapApiList } from "@/lib/api-list";
import { cn } from "@/lib/utils";

function CustomDropdown({ label, options, value, onChange, icon: Icon, disabled, placeholder }: any) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="space-y-1 relative">
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

function CompleteProfileContent() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

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
      <div className="flex min-h-screen bg-[#050505] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#050505] selection:bg-primary/20 relative">
      <MedicalCinematicBg />
      <div className="flex-1 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-[480px]">
          <div className="bg-[#111111]/20 backdrop-blur-3xl backdrop-saturate-150 border border-white/[0.05] rounded-3xl p-6 sm:p-8 relative overflow-hidden">
            <div className="text-center mb-6">
              <MedOneXLogoMark className="h-10 w-10 mx-auto mb-3 text-white" />
              <h3 className="text-xl font-bold text-white">Complete Your Profile</h3>
              <p className="text-[11px] text-white/40 mt-1">Set up your academic profile to get started.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                <input type="text" required value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Full Name"
                  className="w-full bg-white/[0.02] border border-white/[0.07] rounded-xl py-3.5 pl-10 pr-4 text-sm font-medium text-white placeholder:text-white/20 outline-none transition-all focus:border-primary/40 focus:ring-1 focus:ring-primary/20" />
              </div>

              <CustomDropdown label="University" options={unis} value={selUni} onChange={setSelUni} icon={Building2} placeholder="Select University" />
              {selUni && <CustomDropdown label="Faculty" options={faculties} value={selFac} onChange={setSelFac} icon={GraduationCap} placeholder="Select Faculty" />}
              {selFac && (
                <div className="grid grid-cols-2 gap-3">
                  <CustomDropdown label="Year" options={years} value={selYear} onChange={setSelYear} icon={Calendar} placeholder="Select Year" />
                  <CustomDropdown label="Semester" options={semesters} value={selSem} onChange={setSelSem} icon={BookOpen} placeholder="Select Semester" />
                </div>
              )}

              <div className="border-t border-white/[0.06] pt-4 space-y-3">
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                  <input type={showPassword ? "text" : "password"} required value={password} onChange={e => setPassword(e.target.value)} placeholder="Password"
                    className="w-full bg-white/[0.02] border border-white/[0.07] rounded-xl py-3.5 pl-10 pr-10 text-sm font-medium text-white placeholder:text-white/20 outline-none transition-all focus:border-primary/40 focus:ring-1 focus:ring-primary/20" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/60">
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                  <input type="password" required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirm Password"
                    className="w-full bg-white/[0.02] border border-white/[0.07] rounded-xl py-3.5 pl-10 pr-4 text-sm font-medium text-white placeholder:text-white/20 outline-none transition-all focus:border-primary/40 focus:ring-1 focus:ring-primary/20" />
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} className="w-3.5 h-3.5 rounded border-white/20 bg-white/5 accent-primary" />
                <span className="text-[10px] font-medium text-white/40">Remember me — stay logged in on this device</span>
              </label>

              <button type="submit" disabled={loading}
                className="w-full py-3.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-bold tracking-widest uppercase shadow-lg shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Complete Profile"}
              </button>
            </form>
          </div>
        </motion.div>
      </div>
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.06); border-radius: 20px; }
      `}</style>
    </div>
  );
}

export default function CompleteProfilePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#050505] flex items-center justify-center"><MedicalCinematicBg /><Loader2 className="h-6 w-6 animate-spin text-primary z-10" /></div>}>
      <CompleteProfileContent />
    </Suspense>
  );
}
