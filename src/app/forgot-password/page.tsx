"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { MedOneXLogoMark } from "@/components/branding/MedQsLogo";
import { motion, AnimatePresence } from "framer-motion";
import { Envelope, ArrowLeft, CheckCircle, Warning } from "@phosphor-icons/react";
import Link from "next/link";
import toast from "react-hot-toast";

const GLASS = "bg-white/70 dark:bg-[#161523]/70 backdrop-blur-[40px] border border-slate-200/80 dark:border-white/[0.08] shadow-2xl";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;
      setSubmitted(true);
      toast.success("Reset link sent!");
    } catch (err: any) {
      setError(err.message || "Failed to send reset link");
      toast.error(err.message || "Error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ x: [0, 50, 0], y: [0, 30, 0] }} 
          transition={{ duration: 20, repeat: Infinity }} 
          className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-primary/20 blur-[120px] rounded-full" 
        />
        <motion.div 
          animate={{ x: [0, -40, 0], y: [0, 50, 0] }} 
          transition={{ duration: 25, repeat: Infinity }} 
          className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-500/10 blur-[100px] rounded-full" 
        />
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
          <h1 className="text-3xl font-black text-white tracking-tight mb-2">Forgot Password?</h1>
          <p className="text-white/40 text-sm font-medium">No worries, we'll send you reset instructions.</p>
        </div>

        <AnimatePresence mode="wait">
          {!submitted ? (
            <motion.form 
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onSubmit={handleSubmit} 
              className="space-y-6"
            >
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-[0.2em] text-white/40 ml-1">Email Address</label>
                <div className="relative group">
                  <Envelope className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-primary transition-colors" size={20} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
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
                {loading ? "Sending link..." : "Send Reset Link"}
              </button>

              <Link href="/login" className="flex items-center justify-center gap-2 text-white/40 hover:text-white transition-colors text-sm font-bold pt-2">
                <ArrowLeft size={16} />
                Back to login
              </Link>
            </motion.form>
          ) : (
            <motion.div 
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-6"
            >
              <div className="h-20 w-20 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle size={48} weight="fill" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Check your email</h2>
              <p className="text-white/40 text-sm mb-8">
                We've sent a password reset link to <br/>
                <span className="text-white font-bold">{email}</span>
              </p>
              <Link 
                href="/login" 
                className="inline-block w-full py-4.5 rounded-2xl bg-white/5 border border-white/10 text-white text-xs font-black uppercase tracking-[0.2em] hover:bg-white/10 transition-all"
              >
                Return to Login
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
