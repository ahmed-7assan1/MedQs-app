"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function QuizCreatorRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/admin/questions?tab=creator");
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-3">
        <div className="h-8 w-8 animate-spin border-4 border-primary border-t-transparent rounded-full mx-auto" />
        <p className="text-sm text-muted-foreground font-medium">Moving to Assessment Hub...</p>
      </div>
    </div>
  );
}
