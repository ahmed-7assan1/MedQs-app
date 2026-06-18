"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("Processing...");

  useEffect(() => {
    const code = searchParams.get("code");
    const type = searchParams.get("type");
    const next = searchParams.get("next") || "/dashboard-app";

    if (!code) {
      setError("No authorization code provided");
      return;
    }

    setStatus("Exchanging code for session...");

    supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
      if (error) {
        setError(error.message);
        return;
      }

      if (type === "recovery") {
        setStatus("Redirecting to reset password...");
        router.push("/auth/reset-password");
      } else {
        setStatus("Syncing account...");
        fetch("/api/v1/auth/sync", { method: "POST" }).finally(() => {
          router.push(next);
        });
      }
    });
  }, []);

  if (error) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-red-500 text-lg font-bold">Authentication Error</div>
          <div className="text-white/60 text-sm">{error}</div>
          <a href="/auth?mode=login" className="text-primary text-sm underline">Back to login</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center">
      <div className="text-white/60 text-sm">{status}</div>
    </div>
  );
}
