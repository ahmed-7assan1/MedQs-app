"use client";

import React, { useEffect, useRef } from "react";
import { useInView, motion, useSpring, useTransform } from "framer-motion";

interface StatsCounterProps {
  value: number;
  suffix?: string;
  label: string;
}

export const StatsCounter = ({ value, suffix = "", label }: StatsCounterProps) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  
  const springValue = useSpring(0, {
    stiffness: 100,
    damping: 30,
  });

  const displayValue = useTransform(springValue, (current) => 
    Math.round(current).toLocaleString()
  );

  useEffect(() => {
    if (isInView) {
      springValue.set(value);
    }
  }, [isInView, springValue, value]);

  return (
    <div ref={ref} className="text-center p-6 rounded-2xl glass-morphism">
      <div className="flex items-center justify-center font-bold text-4xl sm:text-5xl tracking-tighter">
        <motion.span>{displayValue}</motion.span>
        <span className="text-primary">{suffix}</span>
      </div>
      <p className="mt-2 text-sm font-medium text-muted-foreground uppercase tracking-widest">
        {label}
      </p>
    </div>
  );
};
