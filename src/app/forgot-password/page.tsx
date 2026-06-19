"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Loader2, CheckCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import { NewAuthShell } from "@/components/auth/NewAuthShell";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
      });
      if (error) throw error;
      setSubmitted(true);
      toast.success("Reset link sent!");
    } catch (err: any) {
      toast.error(err.message || "Failed to send reset link");
    } finally {
      setLoading(false);
    }
  };

  return (
    <NewAuthShell
      eyebrow="Password Reset"
      title={submitted ? "Email Sent" : "Forgot Password?"}
      subtitle={submitted ? "Check your inbox for the reset link." : "No worries, we'll send you reset instructions."}
      footer={
        <Link href="/login" className="flex items-center justify-center gap-2 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft size={14} />
          Back to login
        </Link>
      }
    >
      {!submitted ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-foreground/80">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm shadow-sm transition-all placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="group mt-2 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-foreground px-5 text-sm font-semibold text-background shadow-[0_10px_30px_-10px_rgba(0,0,0,0.6)] transition-all hover:bg-foreground/90 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send Reset Link"}
          </button>
        </form>
      ) : (
        <div className="text-center py-8 space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-green-500/10 flex items-center justify-center text-green-500 border border-green-500/20">
            <CheckCircle size={32} />
          </div>
          <p className="text-sm text-muted-foreground">
            We've sent a password reset link to <br />
            <span className="text-foreground font-bold">{email}</span>
          </p>
        </div>
      )}
    </NewAuthShell>
  );
}
