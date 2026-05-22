"use client";
import { motion } from "framer-motion";

interface ProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  bgColor?: string;
  children?: React.ReactNode;
}

export function ProgressRing({
  progress, size = 48, strokeWidth = 3.5,
  color = "stroke-primary", bgColor = "stroke-white/[0.04]",
  children,
}: ProgressRingProps) {
  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (Math.min(progress, 100) / 100) * c;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg className="h-full w-full -rotate-90" viewBox={`0 0 ${size} ${size}`}>
        <circle className={bgColor} strokeWidth={strokeWidth} stroke="currentColor" fill="none" r={r} cx={size / 2} cy={size / 2} />
        <motion.circle
          className={color}
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="none"
          r={r}
          cx={size / 2}
          cy={size / 2}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </svg>
      {children && <div className="absolute inset-0 flex items-center justify-center">{children}</div>}
    </div>
  );
}
