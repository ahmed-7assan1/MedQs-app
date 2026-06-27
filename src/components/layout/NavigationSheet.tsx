"use client";

import { useEffect, useState } from "react";
import { useBodyLock } from "@/hooks/useBodyLock";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X, House, Books, Clock, ClipboardText, Sparkle } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/dashboard-app", label: "HOME", icon: House },
  { href: "/modules", label: "LIBRARY", icon: Books },
  { href: "/ai-chat", label: "DR. Q", icon: Sparkle },
  { href: "/taskat", label: "SCHEDULE", icon: Clock },
  { href: "/past-papers", label: "PRACTICE", icon: ClipboardText },
];

export function NavigationSheet({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useBodyLock(isOpen);

  if (!mounted) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 z-[201] flex flex-col rounded-t-[32px] bg-background border-t border-border shadow-2xl overflow-hidden max-h-[80vh]"
          >
            <div className="w-full flex justify-center pt-4 pb-2" onClick={onClose}>
              <div className="w-12 h-1.5 rounded-full bg-muted-foreground/30" />
            </div>

            <div className="px-6 py-4 flex items-center justify-between">
              <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground">Navigation</h2>
              <button onClick={onClose} aria-label="Close navigation" className="p-2 rounded-full bg-muted/50 hover:bg-muted text-foreground transition-all">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 pb-8">
              <div className="space-y-2 mt-4">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-2xl transition-all",
                      pathname === link.href 
                        ? "bg-primary/10 text-primary" 
                        : "hover:bg-muted/50 text-foreground"
                    )}
                  >
                    <div className={cn(
                      "flex h-12 w-12 items-center justify-center rounded-xl",
                      pathname === link.href ? "bg-primary text-primary-foreground" : "bg-muted"
                    )}>
                      <link.icon className="h-6 w-6" weight={pathname === link.href ? "fill" : "bold"} />
                    </div>
                    <span className="font-black text-lg tracking-wide">{link.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
