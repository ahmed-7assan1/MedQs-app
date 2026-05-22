"use client";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface FloatingActionButtonProps {
  icon: React.ReactNode;
  href?: string;
  onClick?: () => void;
  color?: string;
  size?: "md" | "lg";
  className?: string;
}

export function FloatingActionButton({
  icon, href, onClick, color = "bg-primary", size = "lg", className,
}: FloatingActionButtonProps) {
  const sizeClasses = size === "lg" ? "h-14 w-14" : "h-11 w-11";
  const Tag = href ? motion(Link) : motion.button;
  const props: any = {
    className: cn(
      "flex items-center justify-center rounded-full text-white shadow-xl",
      "hover:scale-105 active:scale-95 transition-all duration-200",
      "ring-2 ring-background",
      sizeClasses,
      color,
      className,
    ),
    whileHover: { scale: 1.05 },
    whileTap: { scale: 0.95 },
  };
  if (href) props.href = href;
  if (onClick) props.onClick = onClick;
  return <Tag {...props}>{icon}</Tag>;
}
