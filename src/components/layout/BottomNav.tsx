"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, BookOpenText, HelpCircle, CircleUser, Clock, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const NAV_ITEMS = [
  { href: "/dashboard-app", label: "Home", icon: House },
  { href: "/modules", label: "Library", icon: BookOpenText },
  { href: "/taskat", label: "Tasks", icon: Clock },
  { href: "/past-papers", label: "Quizzes", icon: HelpCircle },
  { href: "/profile/me", label: "Profile", icon: CircleUser },
];

export function BottomNav() {
  const pathname = usePathname() ?? "";

  // Hide BottomNav on immersive media pages
  if (pathname.startsWith("/videos") || pathname.startsWith("/podcasts") || pathname.startsWith("/ai-chat")) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-[130] md:hidden flex justify-center pb-8 pointer-events-none">
      <div className="flex items-center justify-around w-[92%] max-w-[400px] h-16 bg-[#131220]/70 backdrop-blur-3xl border border-white/10 rounded-[32px] px-2 shadow-[0_20px_50px_rgba(0,0,0,0.5)] pointer-events-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex flex-col items-center justify-center flex-1 h-full group"
            >
              <div className={cn(
                "flex flex-col items-center gap-1 transition-all duration-300",
                isActive ? "text-primary scale-110" : "text-white/30"
              )}>
                <item.icon className={cn("h-5 w-5 transition-all", isActive ? "stroke-[2.5px]" : "stroke-[2px]")} />
                <span className={cn(
                  "text-[9px] font-black uppercase tracking-[0.1em] transition-all",
                  isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                )}>
                  {item.label}
                </span>
              </div>
              
              {isActive && (
                <motion.div 
                  layoutId="bottom-nav-indicator"
                  className="absolute -bottom-1 h-1 w-1 rounded-full bg-primary"
                />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
