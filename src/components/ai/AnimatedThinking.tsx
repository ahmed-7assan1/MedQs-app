"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface AnimatedThinkingProps {
  className?: string;
  words?: string[];
  interval?: number;
}

const DEFAULT_WORDS = [
  "Analyzing",
  "Thinking",
  "Researching",
  "Creating",
  "Reviewing",
  "Processing",
  "Formulating",
];

export function AnimatedThinking({
  className = "",
  words = DEFAULT_WORDS,
  interval = 2200,
}: AnimatedThinkingProps) {
  const [index, setIndex] = useState(0);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % words.length);
    }, interval);
    return () => clearInterval(timer);
  }, [interval, words.length, isClient]);

  if (!isClient) {
    return (
      <span className={className} style={{ color: "#505050" }}>
        Thinking
      </span>
    );
  }

  return (
    <span className={`relative inline-flex items-center ${className}`}>
      <AnimatePresence mode="wait">
        <motion.span
          key={words[index]}
          initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -12, filter: "blur(4px)" }}
          transition={{ duration: 0.35, ease: "easeInOut" }}
          style={{ color: "#505050" }}
        >
          {words[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
