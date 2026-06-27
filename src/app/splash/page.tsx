"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { InstagramLogo, FacebookLogo, TelegramLogo } from "@phosphor-icons/react";
import { MedOneXLogoMark } from "@/components/branding/MedQsLogo";
import { createClient } from "@/lib/supabase/client";

function getRememberMe(): boolean {
  if (typeof document === "undefined") return true;
  return document.cookie.split("; ").find(r => r.startsWith("remember_me="))?.split("=")[1] === "true";
}

export default function SplashPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      setReady(true);
      if (data?.user) {
        const onboardingDone = data.user.user_metadata?.onboarding_completed === true;
        if (!onboardingDone) {
          setTimeout(() => router.replace("/auth?mode=complete-profile"), 2000);
          return;
        }
        if (!getRememberMe()) {
          await supabase.auth.signOut({ scope: "local" });
          setTimeout(() => router.replace("/auth?mode=login"), 2800);
          return;
        }
        setTimeout(() => router.replace("/dashboard-app"), 2000);
      } else {
        setTimeout(() => router.replace("/auth?mode=login"), 2800);
      }
    });
  }, [router]);

  const goToAuth = () => router.replace("/auth?mode=login");

  if (!ready) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <MedOneXLogoMark className="h-16 w-16 text-foreground" interactiveColor />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-background overflow-hidden select-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col items-center gap-6"
      >
        <MedOneXLogoMark className="h-24 w-24 text-foreground" interactiveColor />
        <div className="flex flex-col items-center gap-2">
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="text-4xl font-black tracking-tight text-foreground"
          >
            MedOneX
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="text-sm font-bold uppercase tracking-[0.25em] text-muted-foreground"
          >
            The Way for Excellence
          </motion.p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="absolute bottom-16 flex items-center gap-6"
      >
        <a
          href="https://instagram.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground/50 hover:text-foreground transition-colors duration-300 hover:scale-110 active:scale-95"
        >
          <InstagramLogo size={22} weight="bold" />
        </a>
        <a
          href="https://facebook.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground/50 hover:text-foreground transition-colors duration-300 hover:scale-110 active:scale-95"
        >
          <FacebookLogo size={22} weight="bold" />
        </a>
        <a
          href="https://t.me"
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground/50 hover:text-foreground transition-colors duration-300 hover:scale-110 active:scale-95"
        >
          <TelegramLogo size={22} weight="bold" />
        </a>
      </motion.div>

      <button onClick={goToAuth} className="absolute inset-0 cursor-pointer" aria-label="Continue" />
    </div>
  );
}
