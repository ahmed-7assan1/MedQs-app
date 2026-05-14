"use client";

import React from "react";
import { motion } from "framer-motion";

export const CinematicBackground = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-slate-50 dark:bg-[#05070f] transition-colors duration-500">
      {/* Primary Glow Orb */}
      <motion.div
        animate={{
          x: [0, 100, 0],
          y: [0, 50, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute -top-[10%] -left-[10%] h-[600px] w-[600px] rounded-full bg-blue-400/10 dark:bg-[#2c35af]/20 blur-[120px]"
      />

      {/* Secondary Glow Orb */}
      <motion.div
        animate={{
          x: [0, -80, 0],
          y: [0, 100, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute bottom-0 right-0 h-[500px] w-[500px] rounded-full bg-indigo-400/5 dark:bg-[#4f5fff]/10 blur-[100px]"
      />

      {/* Soft Cyan Highlight */}
      <motion.div
        animate={{
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-[20%] right-[10%] h-[300px] w-[300px] rounded-full bg-cyan-400/5 dark:bg-[#00d4ff]/5 blur-[80px]"
      />

      {/* Grid Overlay */}
      <div 
        className="absolute inset-0 opacity-[0.05] dark:opacity-[0.03]" 
        style={{
          backgroundImage: `linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}
      />

      {/* Floating Particles Simulation (Subtle) */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ 
              x: Math.random() * 100 + "%", 
              y: Math.random() * 100 + "%",
              opacity: Math.random() * 0.5
            }}
            animate={{
              y: ["-10%", "110%"],
              opacity: [0, 0.5, 0]
            }}
            transition={{
              duration: Math.random() * 20 + 10,
              repeat: Infinity,
              ease: "linear",
              delay: Math.random() * 10
            }}
            className="absolute h-1 w-1 rounded-full bg-white/20"
          />
        ))}
      </div>
    </div>
  );
};
