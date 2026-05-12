"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export function SupabaseLoginForm() {
  const router = useRouter();
  const supabase = createClient();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return toast.error("Please enter email and password");
    setLoading(true);
    
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        toast.success("Account created! Check your email to verify.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast.success("Welcome back!");
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      console.error(err);
      toast.error("Google login failed.");
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) return toast.error("Please enter your email address first");
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success("Password reset link sent to your email!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-8">
      <div className="text-center">
        <h2 className="text-xl font-bold text-white mb-2">Welcome to MedOneX</h2>
        <p className="text-[13px] text-white/35 font-medium">Sign in to your medical workspace</p>
      </div>

      <form onSubmit={handleEmailAuth} className="space-y-4">
        <div className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
            className="w-full rounded-xl border border-white/[0.07] bg-[#131220] px-4 py-3.5 text-sm font-medium text-white outline-none transition-all focus:border-primary/40 focus:ring-2 focus:ring-primary/20 placeholder:text-white/20"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full rounded-xl border border-white/[0.07] bg-[#131220] px-4 py-3.5 text-sm font-medium text-white outline-none transition-all focus:border-primary/40 focus:ring-2 focus:ring-primary/20 placeholder:text-white/20"
          />
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="group flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-primary/90 active:scale-[0.98] disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (isSignUp ? "Create Account" : "Continue with Email")}
        </button>
        
        <div className="flex justify-between items-center px-1">
           <button type="button" onClick={() => setIsSignUp(!isSignUp)} className="text-[12px] text-white/40 hover:text-white transition-colors">
              {isSignUp ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
           </button>
           {!isSignUp && (
             <Link href="/forgot-password" className="text-[12px] text-primary/80 hover:text-primary transition-colors">
               Forgot password?
             </Link>
           )}
        </div>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-white/[0.05]" /></div>
        <div className="relative flex justify-center text-xs uppercase"><span className="bg-[#09080F] px-2 text-white/20 font-black tracking-widest">Or continue with</span></div>
      </div>

      <div className="space-y-3">
        <button
          onClick={handleGoogleAuth}
          disabled={loading}
          type="button"
          className="group flex w-full items-center gap-4 rounded-xl border border-white/[0.07] bg-[#131220] px-5 py-3.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-[#1a1928] hover:border-primary/20 active:scale-[0.98]"
        >
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-white shadow-sm">
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.83c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
          </div>
          <span className="flex-1 text-left">Google</span>
        </button>
      </div>
    </div>
  );
}
