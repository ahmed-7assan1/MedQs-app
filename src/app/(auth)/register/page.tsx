"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, User, Mail, Lock, Phone, ArrowRight, Github } from "lucide-react";
import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";
import { MedOneXLogoMark } from "@/components/branding/MedQsLogo";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
  });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password) {
      return toast.error("Please fill in all required fields.");
    }
    if (formData.password.length < 6) {
      return toast.error("Password must be at least 6 characters.");
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
            phone: formData.phone,
          },
        },
      });

      if (error) throw error;

      if (data.session) {
        toast.success("Account created successfully!");
        router.push("/complete-profile");
      } else {
        toast.success("Check your email for a confirmation link!");
        router.push("/login?message=check-email");
      }
    } catch (err: any) {
      toast.error(err.message || "Registration failed.");
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
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      toast.error("Google login failed.");
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-[#09080F] overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 flex w-full max-w-[420px] flex-col items-center px-6">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#131220] border border-white/[0.07] shadow-2xl">
             <MedOneXLogoMark className="h-10 w-10 text-primary" title="MedOneX" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-black tracking-tighter text-white">Join MedOne<span className="text-primary">X</span></h1>
            <p className="text-[11px] font-medium text-white/30 uppercase tracking-[0.2em] mt-1">Start your medical excellence</p>
          </div>
        </div>

        <div className="w-full bg-[#131220]/50 backdrop-blur-xl border border-white/[0.05] rounded-[32px] p-8 shadow-2xl">
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-3">
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 group-focus-within:text-primary transition-colors" />
                <input
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Full Name"
                  className="w-full rounded-xl border border-white/[0.07] bg-[#09080F]/50 px-11 py-3.5 text-sm font-medium text-white outline-none transition-all focus:border-primary/40 focus:ring-2 focus:ring-primary/10 placeholder:text-white/10"
                />
              </div>

              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 group-focus-within:text-primary transition-colors" />
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Email Address"
                  className="w-full rounded-xl border border-white/[0.07] bg-[#09080F]/50 px-11 py-3.5 text-sm font-medium text-white outline-none transition-all focus:border-primary/40 focus:ring-2 focus:ring-primary/10 placeholder:text-white/10"
                />
              </div>

              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 group-focus-within:text-primary transition-colors" />
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Create Password"
                  className="w-full rounded-xl border border-white/[0.07] bg-[#09080F]/50 px-11 py-3.5 text-sm font-medium text-white outline-none transition-all focus:border-primary/40 focus:ring-2 focus:ring-primary/10 placeholder:text-white/10"
                />
              </div>

              <div className="relative group">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 group-focus-within:text-primary transition-colors" />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Phone Number (Optional)"
                  className="w-full rounded-xl border border-white/[0.07] bg-[#09080F]/50 px-11 py-3.5 text-sm font-medium text-white outline-none transition-all focus:border-primary/40 focus:ring-2 focus:ring-primary/10 placeholder:text-white/10"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-primary px-5 py-3.5 text-sm font-bold text-white shadow-xl transition-all hover:bg-primary/90 active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-white/[0.05]" /></div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-widest font-black text-white/20"><span className="bg-[#131220] px-3">Or continue with</span></div>
          </div>

          <button
            onClick={handleGoogleAuth}
            disabled={loading}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/[0.07] bg-white/5 px-5 py-3.5 text-sm font-bold text-white transition-all hover:bg-white/10 active:scale-[0.98]"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.83c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            Google
          </button>
        </div>

        <p className="mt-8 text-center text-[13px] font-medium text-white/20">
          Already have an account?{" "}
          <Link href="/login" className="text-primary hover:underline transition-all">Sign In</Link>
        </p>
      </div>
    </div>
  );
}
