"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase/config";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, OAuthProvider } from "firebase/auth";
import { ArrowRight, Loader2, Mail } from "lucide-react";
import toast from "react-hot-toast";

export function FirebaseLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const handleNextAuthSync = async (idToken: string) => {
    const res = await signIn("credentials", {
      idToken,
      redirect: false,
    });
    if (res?.error) {
      toast.error("Failed to sync session with server.");
      setLoading(false);
    } else {
      toast.success("Welcome to MedQs!");
      router.push("/dashboard");
      router.refresh();
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return toast.error("Please enter email and password");
    setLoading(true);
    
    try {
      let userCred;
      if (isSignUp) {
        userCred = await createUserWithEmailAndPassword(auth, email, password);
      } else {
        userCred = await signInWithEmailAndPassword(auth, email, password);
      }
      const token = await userCred.user.getIdToken();
      await handleNextAuthSync(token);
    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/user-not-found" || err.code === "auth/invalid-credential") {
        toast.error("Invalid credentials or user not found.");
      } else if (err.code === "auth/email-already-in-use") {
        toast.error("Email is already in use. Try logging in.");
        setIsSignUp(false);
      } else {
        toast.error(err.message || "An error occurred");
      }
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const userCred = await signInWithPopup(auth, provider);
      const token = await userCred.user.getIdToken();
      await handleNextAuthSync(token);
    } catch (err: any) {
      console.error(err);
      toast.error("Google login failed.");
      setLoading(false);
    }
  };

  const handleAppleAuth = async () => {
    setLoading(true);
    try {
      const provider = new OAuthProvider('apple.com');
      const userCred = await signInWithPopup(auth, provider);
      const token = await userCred.user.getIdToken();
      await handleNextAuthSync(token);
    } catch (err: any) {
      console.error(err);
      toast.error("Apple login failed.");
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-8">
      <div className="text-center">
        <h2 className="text-xl font-bold text-white mb-2">Welcome back</h2>
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
        
        <div className="text-center">
           <button type="button" onClick={() => setIsSignUp(!isSignUp)} className="text-[12px] text-white/40 hover:text-white transition-colors">
              {isSignUp ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
           </button>
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

        <button
          onClick={handleAppleAuth}
          disabled={loading}
          type="button"
          className="group flex w-full items-center gap-4 rounded-xl border border-white/[0.07] bg-[#131220] px-5 py-3.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-[#1a1928] hover:border-primary/20 active:scale-[0.98]"
        >
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-white shadow-sm">
             <svg className="h-4 w-4 fill-black" viewBox="0 0 384 512"><path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/></svg>
          </div>
          <span className="flex-1 text-left">Apple</span>
        </button>
      </div>
    </div>
  );
}
