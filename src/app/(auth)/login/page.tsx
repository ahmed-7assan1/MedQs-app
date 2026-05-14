import { signIn } from "@/lib/auth";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { MedOneXLogoMark } from "@/components/branding/MedQsLogo";
import { PLATFORM_COPY } from "@/lib/platform-copy";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Users, BookOpen } from "lucide-react";

import { SupabaseLoginForm } from "@/components/auth/SupabaseLoginForm";

export default async function LoginPage() {
  // const session = await auth();
  // if (session?.user) redirect("/dashboard");

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-[#09080F]">
      <div className="relative z-10 flex w-full max-w-[400px] flex-col items-center px-6">
        {/* Logo */}
        <div className="mb-12 flex flex-col items-center gap-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-[24px] bg-[#131220] border border-white/[0.07] shadow-2xl transition-all hover:scale-105 hover:shadow-primary/20">
             <MedOneXLogoMark className="h-12 w-12 text-primary" title="MedOneX" interactiveColor={true} />
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-black tracking-tighter text-white">MedOne<span className="text-primary">X</span></h1>
            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/20 mt-1">Medical Excellence</p>
          </div>
        </div>

        <div className="w-full space-y-8">
          <SupabaseLoginForm />

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

