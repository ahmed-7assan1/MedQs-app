"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Building2, GraduationCap, Calendar, BookOpen, Lock, Eye, EyeOff, CheckCircle, Loader2, ArrowRight } from "lucide-react";
import { CaretUpDown } from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";
import { unwrapApiList } from "@/lib/api-list";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

const ease = [0.22, 1, 0.36, 1] as const;

function Dropdown({ label, options, value, onChange, icon: Icon, disabled, placeholder }: {
  label: string;
  options: { id: string; name?: string; yearNumber?: number }[];
  value: { id: string; name?: string } | null;
  onChange: (v: any) => void;
  icon: any;
  disabled?: boolean;
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease }}
      className="flex flex-col gap-1.5 relative"
    >
      <label className="text-xs font-medium text-foreground/80">{label}</label>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(!open)}
        className={cn(
          "flex h-11 w-full items-center justify-between gap-2 rounded-xl border bg-background px-4 text-sm shadow-sm transition-all",
          open ? "border-primary ring-4 ring-primary/10" : "border-border hover:border-foreground/20",
          disabled && "opacity-40 cursor-not-allowed"
        )}
      >
        <div className="flex items-center gap-2.5 overflow-hidden">
          <Icon className={cn("h-4 w-4 shrink-0", value ? "text-primary" : "text-muted-foreground")} />
          <span className={cn("truncate", value ? "text-foreground font-medium" : "text-muted-foreground/60")}>
            {value ? (options.find((o: any) => o.id === value.id)?.name || value.name) : placeholder}
          </span>
        </div>
        <CaretUpDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            className="absolute z-[100] left-0 right-0 top-full mt-1.5 p-1.5 bg-card border border-border rounded-xl shadow-2xl backdrop-blur-md max-h-[200px] overflow-y-auto"
            style={{ scrollbarWidth: "thin", scrollbarColor: "hsl(var(--border)) transparent" }}
          >
            {options.length === 0 ? (
              <div className="py-6 text-center text-xs text-muted-foreground">No options found</div>
            ) : options.map((opt: any) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => { onChange(opt); setOpen(false); }}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left",
                  value?.id === opt.id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
                )}
              >
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

function PasswordField({ value, onChange, placeholder, show, onToggle }: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  show: boolean;
  onToggle: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease }}
      className="flex flex-col gap-1.5"
    >
      <div className="group relative">
        <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" strokeWidth={2} />
        <input
          type={show ? "text" : "password"}
          required
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="h-11 w-full rounded-xl border border-border bg-background pl-10 pr-10 text-sm shadow-sm transition-all placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:text-foreground"
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </motion.div>
  );
}

export function ProfileCompletionForm({ onComplete }: { onComplete: () => void }) {
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
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
      if (user?.user_metadata?.name) setFullName(user.user_metadata.name);
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
          onboarding_completed: true,
        },
      });
      if (metaError) throw metaError;
      document.cookie = `remember_me=${rememberMe}; path=/; max-age=${rememberMe ? 31536000 : 0}; SameSite=Lax`;
      await fetch("/api/v1/auth/sync", { method: "POST" });
      toast.success("Profile completed!");
      onComplete();
    } catch (err: any) {
      toast.error(err.message || "Something went wrong.");
    } finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Full Name */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease }}
        className="flex flex-col gap-1.5"
      >
        <div className="group relative">
          <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" strokeWidth={2} />
          <input
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Full Name"
            className="h-11 w-full rounded-xl border border-border bg-background pl-10 text-sm shadow-sm transition-all placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
          />
        </div>
      </motion.div>

      {/* University */}
      <Dropdown label="University" options={unis} value={selUni} onChange={setSelUni} icon={Building2} placeholder="Select University" />

      {/* Faculty */}
      {selUni && <Dropdown label="Faculty" options={faculties} value={selFac} onChange={setSelFac} icon={GraduationCap} placeholder="Select Faculty" />}

      {/* Year + Semester */}
      {selFac && (
        <div className="grid grid-cols-2 gap-3">
          <Dropdown label="Year" options={years} value={selYear} onChange={setSelYear} icon={Calendar} placeholder="Year" />
          <Dropdown label="Semester" options={semesters} value={selSem} onChange={setSelSem} icon={BookOpen} placeholder="Semester" />
        </div>
      )}

      {/* Password divider + fields */}
      {selSem && (
        <div className="border-t border-border pt-4 space-y-3">
          <PasswordField value={password} onChange={setPassword} placeholder="Password" show={showPassword} onToggle={() => setShowPassword(!showPassword)} />
          <PasswordField value={confirmPassword} onChange={setConfirmPassword} placeholder="Confirm Password" show={showConfirm} onToggle={() => setShowConfirm(!showConfirm)} />
        </div>
      )}

      {/* Remember Me */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={rememberMe}
          onChange={(e) => setRememberMe(e.target.checked)}
          className="h-3.5 w-3.5 rounded border-border bg-background accent-primary"
        />
        <span className="text-sm text-muted-foreground">Remember me</span>
      </label>

      {/* Submit */}
      <motion.button
        type="submit"
        disabled={loading}
        whileHover={{ y: -1 }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.15, ease }}
        className="group mt-2 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-foreground px-5 text-sm font-semibold text-background shadow-[0_10px_30px_-10px_rgba(0,0,0,0.6)] transition-all hover:bg-foreground/90 disabled:opacity-50"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Complete Profile"}
        {!loading && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />}
      </motion.button>
    </form>
  );
}
