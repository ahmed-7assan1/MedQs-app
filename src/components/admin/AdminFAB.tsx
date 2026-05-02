"use client";

import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

export function AdminFAB() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.5 }}
      className="fixed bottom-24 right-5 md:bottom-8 md:right-7 z-[150]"
    >
      <Link
        href="/admin"
        className="group flex items-center gap-2 h-11 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white pl-3 pr-4 shadow-xl shadow-blue-600/30 hover:shadow-blue-600/50 hover:scale-105 active:scale-95 transition-all duration-200"
        title="Admin Panel"
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20">
          <ShieldCheck className="h-3.5 w-3.5" />
        </span>
        <span className="text-[11px] font-black uppercase tracking-wider hidden sm:inline">Admin</span>
      </Link>
    </motion.div>
  );
}
