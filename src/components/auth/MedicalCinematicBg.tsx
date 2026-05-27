"use client";

import { useEffect, useRef } from "react";

export function MedicalCinematicBg() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);
    let particles: { x: number; y: number; vx: number; vy: number; r: number; a: number }[] = [];
    let frameId: number;

    const resize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", resize);

    for (let i = 0; i < 120; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        r: Math.random() * 2.5 + 0.8,
        a: Math.random() * 0.6 + 0.2,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, w, h);

      /* ── Particles ── */
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(79, 95, 255, ${p.a})`;
        ctx.fill();
      }

      /* ── Connections ── */
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(79, 95, 255, ${0.12 * (1 - dist / 150)})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      frameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <>
      {/* Gradient Orbs — intensified */}
      <div className="absolute top-[-15%] left-[-8%] w-[55%] h-[55%] rounded-full bg-[#4F5FFF]/[0.1] blur-[120px] animate-pulse" style={{ animationDuration: "6s" }} />
      <div className="absolute bottom-[-15%] right-[-8%] w-[50%] h-[45%] rounded-full bg-[#00D4FF]/[0.08] blur-[100px] animate-pulse" style={{ animationDuration: "8s", animationDelay: "2s" }} />
      <div className="absolute top-[25%] right-[-5%] w-[30%] h-[30%] rounded-full bg-[#7B2FF7]/[0.06] blur-[80px] animate-pulse" style={{ animationDuration: "10s", animationDelay: "4s" }} />
      <div className="absolute top-[60%] left-[30%] w-[40%] h-[30%] rounded-full bg-[#4F5FFF]/[0.04] blur-[140px] animate-pulse" style={{ animationDuration: "12s", animationDelay: "1s" }} />

      {/* Canvas Particles */}
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />

      {/* DNA Helix SVGs — intensified */}
      <svg className="absolute top-[8%] left-[6%] w-[140px] h-[280px] opacity-[0.07]" viewBox="0 0 40 80" fill="none">
        <path d="M8 4C18 8 18 14 8 18C-2 22 18 28 8 32" stroke="#4F5FFF" strokeWidth="1.5" opacity="0.7"/>
        <path d="M32 4C22 8 22 14 32 18C42 22 22 28 32 32" stroke="#4F5FFF" strokeWidth="1.5"/>
        <line x1="10" y1="8" x2="30" y2="8" stroke="#4F5FFF" strokeWidth="1" opacity="0.4"/>
        <line x1="8" y1="14" x2="32" y2="14" stroke="#4F5FFF" strokeWidth="1" opacity="0.4"/>
        <line x1="10" y1="22" x2="30" y2="22" stroke="#4F5FFF" strokeWidth="1" opacity="0.4"/>
        <line x1="8" y1="28" x2="32" y2="28" stroke="#4F5FFF" strokeWidth="1" opacity="0.4"/>
      </svg>
      <svg className="absolute bottom-[10%] right-[6%] w-[120px] h-[240px] opacity-[0.06]" viewBox="0 0 40 80" fill="none">
        <path d="M8 4C18 8 18 14 8 18C-2 22 18 28 8 32" stroke="#00D4FF" strokeWidth="1.5" opacity="0.7"/>
        <path d="M32 4C22 8 22 14 32 18C42 22 22 28 32 32" stroke="#00D4FF" strokeWidth="1.5"/>
        <line x1="10" y1="8" x2="30" y2="8" stroke="#00D4FF" strokeWidth="1" opacity="0.4"/>
        <line x1="8" y1="14" x2="32" y2="14" stroke="#00D4FF" strokeWidth="1" opacity="0.4"/>
      </svg>
      <svg className="absolute top-[40%] right-[35%] w-[80px] h-[160px] opacity-[0.04]" viewBox="0 0 40 80" fill="none" style={{ transform: 'rotate(45deg)' }}>
        <path d="M8 4C18 8 18 14 8 18C-2 22 18 28 8 32" stroke="#7B2FF7" strokeWidth="1.2" opacity="0.6"/>
        <path d="M32 4C22 8 22 14 32 18C42 22 22 28 32 32" stroke="#7B2FF7" strokeWidth="1.2"/>
        <line x1="10" y1="8" x2="30" y2="8" stroke="#7B2FF7" strokeWidth="0.8" opacity="0.3"/>
        <line x1="8" y1="14" x2="32" y2="14" stroke="#7B2FF7" strokeWidth="0.8" opacity="0.3"/>
      </svg>

      {/* HUD Elements — intensified */}
      <div className="absolute top-[12%] right-[15%] w-24 h-24 rounded-full border border-[#4F5FFF]/[0.1] opacity-[0.1] hidden lg:block" />
      <div className="absolute top-[15.5%] right-[19%] w-14 h-14 rounded-full border border-[#00D4FF]/[0.08] opacity-[0.08] hidden lg:block" />
      <div className="absolute bottom-[20%] left-[10%] w-20 h-20 rounded-full border border-[#7B2FF7]/[0.08] opacity-[0.08] hidden lg:block" />
      <div className="absolute bottom-[24.5%] left-[7.5%] w-10 h-10 border border-[#4F5FFF]/[0.07] opacity-[0.07] rotate-45 hidden lg:block" />
      <div className="absolute top-[30%] left-[45%] w-16 h-0.5 bg-gradient-to-r from-transparent via-[#00D4FF]/[0.12] to-transparent hidden lg:block" />
      <div className="absolute top-[33%] left-[45%] w-10 h-0.5 bg-gradient-to-r from-transparent via-[#4F5FFF]/[0.08] to-transparent hidden lg:block" />

      {/* Grid Overlay — intensified */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
        backgroundImage: `linear-gradient(rgba(79, 95, 255, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(79, 95, 255, 0.3) 1px, transparent 1px)`,
        backgroundSize: '60px 60px'
      }} />

      {/* Grain Texture */}
      <div className="absolute inset-0 opacity-[0.025] pointer-events-none" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.5'/%3E%3C/svg%3E")`,
        backgroundSize: '128px 128px',
      }} />
    </>
  );
}
