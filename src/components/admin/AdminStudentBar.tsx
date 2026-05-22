"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  LayoutDashboard,
  Settings,
  Users,
  BookOpen,
  FileText,
  MessageSquare,
  Video,
  HelpCircle,
  Layers,
  Zap,
  Megaphone,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PLATFORM_COPY } from "@/lib/platform-copy";

const LINKS = [
  { href: "/admin/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/settings", label: "Site settings", icon: Settings },
  { href: "/admin/teams", label: "Medical Teams", icon: Users },
  { href: "/admin/founders", label: "Founders / Team", icon: ShieldCheck },
  { href: "/admin/past-papers", label: "Past papers / quizzes", icon: FileText },
  { href: "/admin/questions", label: "Questions", icon: HelpCircle },
  { href: "/admin/quiz-creator", label: "Quiz creator", icon: Layers },
  { href: "/admin/forum", label: "Forum", icon: MessageSquare },
  { href: "/admin/ai-tools", label: "AI tools", icon: Zap },
  { href: "/admin/ads", label: "Ads", icon: Megaphone },
];

/** Floating doctor hub menu on student pages (same routes as /admin). */
export function AdminStudentBar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  if (pathname?.startsWith("/ai-chat")) return null;

  return (
    <div className="pointer-events-none fixed bottom-24 right-4 z-[200] md:bottom-8 md:right-8">
      <div className="pointer-events-auto flex flex-col items-end gap-4">
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="mb-4 w-[280px] overflow-hidden rounded-[32px] border border-gray-200/10 bg-[#131220]/90 p-3 shadow-2xl backdrop-blur-2xl"
              role="menu"
            >
              <div className="border-t border-gray-200/10 p-3">
                 <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                   Admin Command Center
                 </p>
              </div>
              <div className="max-h-[min(60vh,400px)] overflow-y-auto no-scrollbar space-y-1">
                {LINKS.map(({ href, label, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold text-white/60 hover:text-white hover:bg-white/5 transition-all group"
                  >
                    <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                       <Icon className="h-4 w-4" aria-hidden />
                    </div>
                    {label}
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setOpen((o) => !o)}
          className={cn(
            "flex h-14 w-14 items-center justify-center rounded-full border border-gray-200/10 bg-primary text-white shadow-2xl shadow-primary/40 backdrop-blur-md transition-all",
            open && "rotate-[135deg] bg-red-500 shadow-red-500/40 border-red-500/20"
          )}
          aria-expanded={open}
        >
          {open ? <ShieldCheck className="h-6 w-6" /> : <ShieldCheck className="h-7 w-7" />}
        </motion.button>
      </div>
    </div>
  );
}

