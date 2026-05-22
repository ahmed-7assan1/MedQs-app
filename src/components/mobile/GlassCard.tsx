"use client";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "button" | "a";
  hover?: boolean;
  glow?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
  onClick?: () => void;
  href?: string;
}

const paddings = {
  none: "",
  sm: "p-3",
  md: "p-4",
  lg: "p-6",
};

export function GlassCard({
  children, className, as = "div", hover = true, glow = false,
  padding = "md", onClick, href,
}: GlassCardProps) {
  const Tag = href ? motion.a : motion[as as keyof typeof motion] as any;
  const props = {
    className: cn(
      "rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl",
      "shadow-[0_8px_32px_rgba(0,0,0,0.12)]",
      hover && "transition-all duration-300 hover:border-white/[0.12] hover:bg-white/[0.04]",
      glow && "shadow-[0_0_40px_rgba(108,95,240,0.08)]",
      paddings[padding],
      className,
    ),
    whileTap: hover ? { scale: 0.98 } : undefined,
    onClick,
    ...(href ? { href } : {}),
  };
  return <Tag {...props}>{children}</Tag>;
}
