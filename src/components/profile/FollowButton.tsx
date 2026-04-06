"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export function FollowButton({ userId }: { userId: string }) {
  const [following, setFollowing] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/v1/follow/${userId}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => {
        if (cancelled) return;
        setFollowing(Boolean(j?.following));
      })
      .catch(() => {
        if (cancelled) return;
        setFollowing(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  async function toggle() {
    setBusy(true);
    try {
      const res = await fetch(`/api/v1/follow/${userId}`, { method: "POST" });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(typeof j?.error === "string" ? j.error : "Failed");
        return;
      }
      setFollowing(Boolean(j?.following));
      toast.success(Boolean(j?.following) ? "Followed" : "Unfollowed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={() => void toggle()}
      disabled={busy || following === null}
      className={
        following
          ? "inline-flex items-center gap-1.5 rounded-xl border border-border bg-muted px-3 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-muted/70 disabled:opacity-50"
          : "inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:opacity-95 disabled:opacity-50"
      }
    >
      {following === null ? "..." : following ? "Following" : "Follow"}
    </button>
  );
}

