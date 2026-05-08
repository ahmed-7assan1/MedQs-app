"use client";

import { useState, useEffect, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

const ROUTES = [
  "/dashboard-app",
  "/modules",
  "/taskat",
  "/quizzes",
  "/ai-chat"
];

interface MobileSwipeLayoutProps {
  children: React.ReactNode;
}

export function MobileSwipeLayout({ children }: MobileSwipeLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const currentIndex = useMemo(() => {
    return ROUTES.findIndex(route => 
      route === "/dashboard-app" ? pathname === route || pathname === "/dashboard" : pathname?.startsWith(route)
    );
  }, [pathname]);

  if (!isMobile || currentIndex === -1) {
    return <>{children}</>;
  }

  const handleDragEnd = (event: any, info: any) => {
    const swipeThreshold = 50;
    if (info.offset.x > swipeThreshold && currentIndex > 0) {
      // Swipe Right -> Previous Tab
      router.push(ROUTES[currentIndex - 1]);
    } else if (info.offset.x < -swipeThreshold && currentIndex < ROUTES.length - 1) {
      // Swipe Left -> Next Tab
      router.push(ROUTES[currentIndex + 1]);
    }
  };

  return (
    <motion.div
      className="flex-1 flex flex-col w-full h-full relative overflow-hidden touch-pan-y"
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.2}
      onDragEnd={handleDragEnd}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={pathname}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="flex-1 flex flex-col w-full pt-20"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
