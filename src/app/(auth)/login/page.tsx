import { signIn } from "@/lib/auth";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { MedQsLogoMark } from "@/components/branding/MedQsLogo";
import { PLATFORM_COPY } from "@/lib/platform-copy";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Users, BookOpen } from "lucide-react";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-[#09080F]">
      <div className="relative z-10 flex w-full max-w-[400px] flex-col items-center px-6">
        {/* Logo */}
        <div className="mb-12 flex flex-col items-center gap-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-[24px] bg-[#131220] border border-white/[0.07] shadow-2xl transition-all hover:scale-105 hover:shadow-primary/20">
             <MedQsLogoMark className="h-12 w-12 text-primary" title="MedOneX" interactiveColor={true} />
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-black tracking-tighter text-white">MedOne<span className="text-primary">X</span></h1>
            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/20 mt-1">Medical Excellence</p>
          </div>
        </div>

        <div className="w-full space-y-8">
          <div className="text-center">
            <h2 className="text-xl font-bold text-white mb-2">Welcome back</h2>
            <p className="text-[13px] text-white/35 font-medium">Sign in to your medical workspace</p>
          </div>

          {/* Social Auth */}
          <div className="space-y-3">
            <form action={async () => { "use server"; await signIn("google", { redirectTo: "/dashboard" }); }}>
              <button type="submit"
                className="group flex w-full items-center gap-4 rounded-2xl border border-white/[0.07] bg-[#131220] px-5 py-4 text-sm font-bold text-white shadow-sm transition-all hover:bg-[#1a1928] hover:border-primary/20 active:scale-[0.98]">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-sm">
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.83c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                </div>
                <span className="flex-1">Continue with Google</span>
                <ArrowRight className="h-4 w-4 opacity-0 -translate-x-2 transition-all group-hover:opacity-40 group-hover:translate-x-0" />
              </button>
            </form>

            <form action={async () => { "use server"; await signIn("facebook", { redirectTo: "/dashboard" }); }}>
              <button type="submit"
                className="group flex w-full items-center gap-4 rounded-2xl border border-white/[0.07] bg-[#131220] px-5 py-4 text-sm font-bold text-white shadow-sm transition-all hover:bg-[#1a1928] hover:border-primary/20 active:scale-[0.98]">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1877F2] shadow-sm">
                  <svg className="h-4 w-4 fill-white" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </div>
                <span className="flex-1">Continue with Facebook</span>
                <ArrowRight className="h-4 w-4 opacity-0 -translate-x-2 transition-all group-hover:opacity-40 group-hover:translate-x-0" />
              </button>
            </form>
          </div>

          <div className="flex flex-col gap-4 pt-6">
            <Link href="/guest/past-papers" className="text-center text-[11px] font-bold text-white/20 hover:text-primary transition-colors uppercase tracking-[0.2em]">
               Browse as Guest
            </Link>
            <div className="h-px bg-white/[0.03]" />
            <p className="text-center text-[10px] leading-relaxed text-white/10 px-8">
               By continuing, you agree to our <a href="/terms" className="text-white/20 hover:underline">Terms</a> & <a href="/privacy" className="text-white/20 hover:underline">Privacy</a>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

