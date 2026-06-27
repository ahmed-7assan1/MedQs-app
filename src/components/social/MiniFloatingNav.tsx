"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { House, Books, Question, Sparkle, Gear } from "@phosphor-icons/react/dist/ssr";

const QUICK_LINKS = [
  { href: "/dashboard-app", icon: House, label: "Home" },
  { href: "/modules", icon: Books, label: "Lectures" },
  { href: "/past-papers", icon: Question, label: "Quizzes" },
  { href: "/ai-chat", icon: Sparkle, label: "AI Chat" },
  { href: "/settings", icon: Gear, label: "Settings" },
];

export function MiniFloatingNav() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  return createPortal(
    <div ref={ref} style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999 /* z-max */ }}>
      {/* Menu */}
      {open && (
        <div style={{
          position: "absolute", bottom: 56, right: 0,
          background: "rgba(15,15,25,.92)", backdropFilter: "blur(24px)",
          border: "1px solid rgba(255,255,255,.08)", borderRadius: 20,
          padding: 8, display: "flex", flexDirection: "column", gap: 2,
          boxShadow: "0 16px 48px rgba(0,0,0,.6)", minWidth: 180,
        }}>
          {QUICK_LINKS.map(item => (
            <Link key={item.href} href={item.href} onClick={() => setOpen(false)}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 14px", borderRadius: 12, textDecoration: "none",
                color: "rgba(255,255,255,.75)", fontSize: 13, fontWeight: 600,
                transition: "all .15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(91,94,247,.15)"; e.currentTarget.style.color = "#fff"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "rgba(255,255,255,.75)"; }}>
              <item.icon className="h-4 w-4" weight="bold" />
              {item.label}
            </Link>
          ))}
        </div>
      )}

      {/* Floating button */}
      <button onClick={() => setOpen(o => !o)}
        style={{
          width: 46, height: 46, borderRadius: 16,
          background: "rgba(91,94,247,.9)", backdropFilter: "blur(12px)",
          border: "1px solid rgba(255,255,255,.15)",
          color: "#fff", cursor: "pointer", display: "flex",
          alignItems: "center", justifyContent: "center",
          boxShadow: "0 8px 24px rgba(91,94,247,.35)",
          transition: "all .2s",
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.08)"; }}
        onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2v20M2 12h20"/></svg>
      </button>
    </div>,
    document.body
  );
}
