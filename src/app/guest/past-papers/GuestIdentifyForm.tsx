"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";

export function GuestIdentifyForm() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [externalStudentId, setExternalStudentId] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/v1/guest-quiz/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName, externalStudentId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(typeof data?.error === "string" ? data.error : "Could not continue");
        return;
      }
      toast.success("Welcome — you can take quizzes on this device.");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md rounded-2xl border border-border bg-card p-6 shadow-sm">
      <h1 className="font-display text-2xl font-bold">Quizzes (guest)</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Enter your name and ID once on this device. No account is created — this is temporary until full access is enabled.
      </p>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Your name *</label>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
            placeholder="Full name"
            autoComplete="name"
            required
            minLength={2}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Student / national ID *</label>
          <input
            value={externalStudentId}
            onChange={(e) => setExternalStudentId(e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
            placeholder="ID number"
            autoComplete="username"
            required
          />
        </div>
        <button
          type="submit"
          disabled={busy}
          className="btn btn-primary flex w-full items-center justify-center gap-2 py-2.5 disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Continue to quizzes
        </button>
      </form>
    </div>
  );
}
