"use client";

import { useRef, useEffect, useCallback } from "react";

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  size: number;
  alpha: number;
  life: number;
  maxLife: number;
}

interface Props {
  count?: number;
  color?: string;
  speed?: number;
  mouseReactive?: boolean;
  className?: string;
  zIndex?: number;
}

export function ParticleField({
  count = 80,
  color = "rgba(124, 92, 252, 0.6)",
  speed = 0.3,
  mouseReactive = true,
  className = "",
  zIndex = 0,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const frameRef = useRef(0);

  const initParticle = useCallback((w: number, h: number): Particle => ({
    x: Math.random() * w,
    y: Math.random() * h,
    vx: (Math.random() - 0.5) * speed,
    vy: (Math.random() - 0.5) * speed,
    size: Math.random() * 2.5 + 0.5,
    alpha: Math.random() * 0.5 + 0.2,
    life: 0,
    maxLife: Math.random() * 300 + 200,
  }), [speed]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId = 0;
    let w = 0, h = 0;

    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas!.width = w;
      canvas!.height = h;
      particlesRef.current = Array.from({ length: count }, () => initParticle(w, h));
    };
    resize();
    window.addEventListener("resize", resize);

    if (mouseReactive) {
      const onMove = (e: MouseEvent) => { mouseRef.current.x = e.clientX; mouseRef.current.y = e.clientY; };
      const onLeave = () => { mouseRef.current.x = -1000; mouseRef.current.y = -1000; };
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseleave", onLeave);
    }

    const animate = () => {
      animId = requestAnimationFrame(animate);
      ctx!.clearRect(0, 0, w, h);
      const particles = particlesRef.current;
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.life++;
        if (p.life > p.maxLife || p.x < -20 || p.x > w + 20 || p.y < -20 || p.y > h + 20) {
          Object.assign(p, initParticle(w, h));
          p.life = 0;
        }
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;

        const fade = p.life < 40 ? p.life / 40 : 1;
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx!.fillStyle = color.replace(/[\d.]+\)$/, `${p.alpha * fade})`);
        ctx!.fill();

        // Connections
        for (const other of particles) {
          const dx = p.x - other.x;
          const dy = p.y - other.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx!.beginPath();
            ctx!.moveTo(p.x, p.y);
            ctx!.lineTo(other.x, other.y);
            ctx!.strokeStyle = color.replace(/[\d.]+\)$/, `${0.08 * (1 - dist / 120)})`);
            ctx!.lineWidth = 0.5;
            ctx!.stroke();
          }
        }

        // Mouse interaction
        if (mouseReactive && mx > 0) {
          const mdx = p.x - mx;
          const mdy = p.y - my;
          const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
          if (mdist < 150) {
            ctx!.beginPath();
            ctx!.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2);
            ctx!.fillStyle = color.replace(/[\d.]+\)$/, `${0.15 * (1 - mdist / 150)})`);
            ctx!.fill();
          }
        }
      }
      frameRef.current++;
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
      if (mouseReactive) {
        window.removeEventListener("mousemove", () => {});
        window.removeEventListener("mouseleave", () => {});
      }
    };
  }, [count, color, speed, mouseReactive, initParticle]);

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 pointer-events-none ${className}`}
      style={{ zIndex }}
    />
  );
}
