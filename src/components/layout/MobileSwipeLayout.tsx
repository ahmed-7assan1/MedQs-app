"use client";

import { useState, useEffect, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

import {
  MOBILE_SWIPE_ROUTES,
  matchMobileSwipeRoute,
  mobileSwipeRouteIndex,
} from "@/lib/mobile-chrome";

interface MobileSwipeLayoutProps {
  children: React.ReactNode;
}

export function MobileSwipeLayout({ children }: MobileSwipeLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const currentIndex = useMemo(
    () => mobileSwipeRouteIndex(pathname ?? ""),
    [pathname]
  );

  if (!isMobile || currentIndex === -1) {
    return <>{children}</>;
  }

  const handleDragEnd = (event: any, info: any) => {
    const swipeThreshold = 50;
    if (info.offset.x > swipeThreshold && currentIndex > 0) {
      // Swipe Right -> Previous Tab
      router.push(MOBILE_SWIPE_ROUTES[currentIndex - 1]);
    } else if (info.offset.x < -swipeThreshold && currentIndex < MOBILE_SWIPE_ROUTES.length - 1) {
      // Swipe Left -> Next Tab
      router.push(MOBILE_SWIPE_ROUTES[currentIndex + 1]);
    }
  };

  return (
    <motion.div
      className="flex-1 flex flex-col w-full h-full relative overflow-hidden touch-pan-y"
      style={{ willChange: "transform" }}
      drag={prefersReducedMotion ? false : "x"}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.2}
      onDragEnd={handleDragEnd}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={pathname}
          initial={prefersReducedMotion ? false : { opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={prefersReducedMotion ? false : { opacity: 0, x: -20 }}
          transition={prefersReducedMotion ? { duration: 0 } : { type: "spring", stiffness: 300, damping: 30 }}
          className="flex-1 flex flex-col w-full min-h-0"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
