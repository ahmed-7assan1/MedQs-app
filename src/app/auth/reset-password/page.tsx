"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { LockKey, Eye, EyeSlash, CircleNotch, CheckCircle, ShieldCheck, XCircle } from "@phosphor-icons/react";
import { MedOneXLogoMark } from "@/components/branding/MedQsLogo";
import { CinematicBackground } from "@/components/landing/CinematicBackground";
import toast from "react-hot-toast";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [sessionReady, setSessionReady] = useState<boolean | null>(null);

  // Supabase sends the reset token via URL fragment (#access_token=...)
  // The Supabase client automatically handles this when we call getSession
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSessionReady(!!session);
    });
  }, []);

  const passwordStrength = () => {
    if (password.length === 0) return { label: "", color: "", width: "0%" };
    if (password.length < 6) return { label: "Too short", color: "bg-red-500", width: "25%" };
    if (password.length < 8) return { label: "Weak", color: "bg-orange-500", width: "50%" };
    if (!/[A-Z]/.test(password) || !/[0-9]/.test(password)) return { label: "Medium", color: "bg-yellow-500", width: "75%" };
    return { label: "Strong", color: "bg-green-500", width: "100%" };
  };

  const strength = passwordStrength();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) return toast.error("Passwords do not match.");
    if (password.length < 8) return toast.error("Password must be at least 8 characters.");
    
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      toast.error(error.message);
    } else {
      setSuccess(true);
      setTimeout(() => router.push("/dashboard"), 3000);
    }
  };

  return (
    <div className="relative z-10 w-full max-w-[420px] flex flex-col items-center px-4 pt-12 pb-24 mx-auto">
      {/* Brand Header */}
      <div className="mb-10 flex flex-col items-center text-center">
        <div className="p-4 rounded-[24px] bg-white/40 dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-xl backdrop-blur-xl mb-6">
          <MedOneXLogoMark className="h-12 w-12 text-slate-900 dark:text-white" />
        </div>
        <h1 className="text-3xl font-display font-black tracking-tight text-slate-900 dark:text-white">
          {success ? "Password Updated!" : "New Password"}
        </h1>
        <p className="text-sm text-slate-500 dark:text-white/50 mt-2 font-medium">
          {success ? "Redirecting you to your workspace..." : "Create a strong, secure password for your account."}
        </p>
      </div>

      <div className="w-full bg-white/60 dark:bg-[#05070f]/60 backdrop-blur-3xl border border-slate-200 dark:border-white/10 rounded-[32px] p-8 shadow-2xl">
        {sessionReady === null ? (
          <div className="py-12 flex justify-center">
            <CircleNotch className="animate-spin text-blue-500" size={32} />
          </div>
        ) : !sessionReady ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-6 space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 flex items-center justify-center">
              <XCircle size={36} weight="fill" className="text-red-500" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white">Invalid or Expired Link</h3>
            <p className="text-sm text-slate-500 dark:text-white/50">This password reset link has expired or already been used.</p>
            <button onClick={() => router.push("/auth?mode=login")} className="mt-2 text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline">
              Request a new link →
            </button>
          </motion.div>
        ) : success ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-6 space-y-5">
            <div className="w-20 h-20 mx-auto rounded-full bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 flex items-center justify-center">
              <CheckCircle size={40} weight="fill" className="text-green-500" />
            </div>
            <p className="text-sm text-slate-500 dark:text-white/50">
              Your password has been updated successfully. You'll be redirected to your dashboard in a moment.
            </p>
            <div className="h-1.5 w-full bg-slate-200 dark:bg-white/5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 3, ease: "linear" }}
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
              />
            </div>
          </motion.div>
        ) : (
          <form onSubmit={handleReset} className="space-y-5">
            <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 flex items-center gap-3">
              <ShieldCheck size={20} weight="fill" className="text-blue-500 shrink-0" />
              <p className="text-xs text-blue-700 dark:text-blue-300 font-medium">Use 8+ characters with uppercase letters and numbers for a strong password.</p>
            </div>

            {/* New Password */}
            <div className="space-y-1">
              <div className="relative group">
                <LockKey className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/20 group-focus-within:text-blue-500 transition-colors" size={20} />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="New Password"
                  className="w-full bg-slate-100/50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.05] rounded-2xl py-4 pl-12 pr-12 text-sm text-slate-900 dark:text-white focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-white/20"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/20 hover:text-slate-600 dark:hover:text-white/60 transition-colors">
                  {showPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {/* Strength Meter */}
              {password.length > 0 && (
                <div className="space-y-1 px-1">
                  <div className="h-1 w-full bg-slate-200 dark:bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      animate={{ width: strength.width }}
                      transition={{ duration: 0.3 }}
                      className={`h-full rounded-full ${strength.color}`}
                    />
                  </div>
                  <p className={`text-[10px] font-bold ${strength.color.replace("bg-", "text-")}`}>{strength.label}</p>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="relative group">
              <LockKey className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/20 group-focus-within:text-blue-500 transition-colors" size={20} />
              <input
                type={showConfirm ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Confirm New Password"
                className={`w-full bg-slate-100/50 dark:bg-white/[0.03] border rounded-2xl py-4 pl-12 pr-12 text-sm text-slate-900 dark:text-white focus:ring-4 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-white/20 ${
                  confirmPassword && password !== confirmPassword
                    ? "border-red-400 dark:border-red-500/50 focus:ring-red-500/10 focus:border-red-400"
                    : "border-slate-200 dark:border-white/[0.05] focus:border-blue-500/50 focus:ring-blue-500/10"
                }`}
              />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/20 hover:text-slate-600 dark:hover:text-white/60 transition-colors">
                {showConfirm ? <EyeSlash size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {confirmPassword && password !== confirmPassword && (
              <p className="text-xs text-red-500 font-medium px-1">Passwords don't match</p>
            )}

            <button
              type="submit"
              disabled={loading || !password || !confirmPassword || password !== confirmPassword}
              className="w-full group overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 p-px shadow-xl shadow-blue-500/20 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl py-4 flex items-center justify-center gap-2 font-bold text-white tracking-wide group-hover:opacity-90">
                {loading ? <CircleNotch className="animate-spin" size={20} /> : <><ShieldCheck size={18} weight="fill" /> Update Password</>}
              </div>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="relative min-h-screen flex flex-col bg-slate-50 dark:bg-[#05070f] selection:bg-blue-500/30">
      <CinematicBackground />
      <Suspense fallback={
        <div className="flex-1 flex items-center justify-center">
          <CircleNotch className="animate-spin text-blue-500" size={32} />
        </div>
      }>
        <ResetPasswordContent />
      </Suspense>
    </div>
  );
}
