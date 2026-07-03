"use client";

import { motion } from "framer-motion";
import { usePathname } from "next/navigation";

export function PageTransitionProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.18,
        ease: "easeOut",
      }}
      className="w-full flex-1 flex flex-col"
      style={{ isolation: "isolate" }}
    >
      <div className="flex-1 flex flex-col">
        {children}
      </div>
    </motion.div>
  );
}
