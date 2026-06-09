"use client";

import { useState } from "react";

const FONT = "var(--font-cairo), var(--font-geist-sans), system-ui, sans-serif";

export function ActionBtn({ icon, label, active, activeColor, activeBg, onClick }: {
  icon: React.ReactNode; label: string; active?: boolean; activeColor?: string; activeBg?: string; onClick: (e: React.MouseEvent) => void;
}) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
        gap: 6, padding: "9px 6px", border: "none", borderRadius: 12,
        background: active ? (activeBg || "hsl(var(--primary) / 0.1)") : hov ? "hsl(var(--card))" : "none",
        color: active ? activeColor || "hsl(var(--primary))" : hov ? "hsl(var(--primary) / 0.8)" : "hsl(var(--muted-foreground))",
        fontSize: 12, fontWeight: 600, cursor: "pointer",
        fontFamily: FONT, transition: "all .15s",
      }}>{icon}{label}</button>
  );
}
