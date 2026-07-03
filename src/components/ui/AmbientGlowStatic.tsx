"use client";

export function AmbientGlowStatic({ className = "", zIndex = -1 }: { className?: string; zIndex?: number }) {
  return (
    <div
      className={`fixed inset-0 pointer-events-none ${className}`}
      style={{ zIndex }}
    >
      <div
        className="absolute inset-0 opacity-[0.15] dark:opacity-[0.08]"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 20% 20%, rgba(124,92,252,0.3) 0%, transparent 60%)," +
            "radial-gradient(ellipse 60% 50% at 80% 80%, rgba(236,72,153,0.2) 0%, transparent 60%)," +
            "radial-gradient(ellipse 50% 40% at 50% 50%, rgba(79,95,255,0.15) 0%, transparent 60%)",
        }}
      />
    </div>
  );
}
