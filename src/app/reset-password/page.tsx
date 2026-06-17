"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { MedOneXLogoMark } from "@/components/branding/MedQsLogo";
import { motion } from "framer-motion";
import { Lock, Eye, EyeSlash, Warning, CheckCircle } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

const GLASS = "bg-card/70 backdrop-blur-[40px] border border-border shadow-2xl";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Supabase will automatically handle the session from the URL hash
    // We just need to make sure the user is actually in a reset state
    const supabase = createClient();
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        console.log("PASSWORD_RECOVERY mode active");
      }
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });

      if (error) throw error;

      await fetch("/api/v1/auth/sync-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      
      setSuccess(true);
      toast.success("Password updated successfully!");
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch (err: any) {
      setError(err.message || "Failed to update password");
      toast.error(err.message || "Error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-primary/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-500/10 blur-[100px] rounded-full" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`${GLASS} w-full max-w-md rounded-[40px] p-10 relative z-10`}
      >
        <div className="flex flex-col items-center text-center mb-10">
          <div className="h-16 w-16 bg-gradient-to-br from-primary to-indigo-600 rounded-[20px] flex items-center justify-center shadow-xl shadow-primary/20 mb-6">
            <MedOneXLogoMark className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight mb-2">New Password</h1>
          <p className="text-white/40 text-sm font-medium">Create a strong password for your account.</p>
        </div>

        {!success ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase tracking-[0.2em] text-white/40 ml-1">New Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-primary transition-colors" size={20} />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-12 text-white focus:outline-none focus:border-primary/50 focus:ring-4 ring-primary/5 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeSlash size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase tracking-[0.2em] text-white/40 ml-1">Confirm Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-primary transition-colors" size={20} />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-primary/50 focus:ring-4 ring-primary/5 transition-all"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-center gap-3 text-red-400 text-sm">
                <Warning size={20} weight="fill" />
                {error}
              </div>
            )}

            <button
              disabled={loading}
              className="w-full py-4.5 rounded-2xl bg-primary text-white font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? "Updating..." : "Reset Password"}
            </button>
          </form>
        ) : (
          <div className="text-center py-6">
            <div className="h-20 w-20 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={48} weight="fill" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Success!</h2>
            <p className="text-white/40 text-sm mb-8">
              Your password has been reset. <br/>
              Redirecting you to login...
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
