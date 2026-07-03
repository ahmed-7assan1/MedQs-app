"use client";

import { useRef, useEffect } from "react";

interface Orb {
  x: number; y: number;
  radius: number;
  color: string;
  vx: number; vy: number;
  alpha: number;
}

interface Props {
  orbCount?: number;
  colors?: string[];
  className?: string;
  zIndex?: number;
}

export function AmbientGlow({
  orbCount = 2,
  colors = ["rgba(124, 92, 252, 0.12)", "rgba(236, 72, 153, 0.08)", "rgba(79, 95, 255, 0.10)"],
  className = "",
  zIndex = -1,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId = 0;
    let w = 0, h = 0;
    let hidden = false;
    const orbs: Orb[] = [];

    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas!.width = w;
      canvas!.height = h;
      orbs.length = 0;
      for (let i = 0; i < orbCount; i++) {
        orbs.push({
          x: Math.random() * w,
          y: Math.random() * h,
          radius: Math.random() * 200 + 180,
          color: colors[i % colors.length],
          vx: (Math.random() - 0.5) * 0.2,
          vy: (Math.random() - 0.5) * 0.2,
          alpha: Math.random() * 0.3 + 0.2,
        });
      }
    };
    resize();
    window.addEventListener("resize", resize);

    const onVisibilityChange = () => {
      hidden = document.hidden;
      if (hidden) {
        cancelAnimationFrame(animId);
      } else {
        animate();
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    const animate = () => {
      if (hidden) return;
      animId = requestAnimationFrame(animate);
      ctx!.clearRect(0, 0, w, h);

      for (const orb of orbs) {
        orb.x += orb.vx;
        orb.y += orb.vy;
        orb.vx += (Math.random() - 0.5) * 0.01;
        orb.vy += (Math.random() - 0.5) * 0.01;
        orb.vx = Math.max(-0.3, Math.min(0.3, orb.vx));
        orb.vy = Math.max(-0.3, Math.min(0.3, orb.vy));

        if (orb.x < -orb.radius || orb.x > w + orb.radius) orb.vx *= -1;
        if (orb.y < -orb.radius || orb.y > h + orb.radius) orb.vy *= -1;

        const gradient = ctx!.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, orb.radius);
        gradient.addColorStop(0, orb.color);
        gradient.addColorStop(0.4, orb.color.replace(/[\d.]+\)$/, "0.04)"));
        gradient.addColorStop(1, "transparent");
        ctx!.fillStyle = gradient;
        ctx!.fillRect(0, 0, w, h);
      }
    };
    animate();

    return () => {
      hidden = true;
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [orbCount, colors]);

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 pointer-events-none ${className}`}
      style={{ zIndex }}
    />
  );
}
