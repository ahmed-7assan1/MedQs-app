"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function PullToRefresh({ onRefresh, children }: { onRefresh: () => void; children: React.ReactNode }) {
  const [refreshing, setRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isAtTop, setIsAtTop] = useState(true);
  const [isTouch, setIsTouch] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const threshold = 80;

  useEffect(() => { setIsTouch("ontouchstart" in window); }, []);

  useEffect(() => {
    const handleScroll = () => setIsAtTop(window.scrollY <= 0);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const doRefresh = useCallback(async () => {
    if (refreshing) return;
    setRefreshing(true);
    setPullDistance(threshold);
    onRefresh();
    await new Promise(r => setTimeout(r, 600));
    setRefreshing(false);
    setPullDistance(0);
  }, [onRefresh, refreshing]);

  if (!isTouch) return <>{children}</>;

  return (
    <div className="relative" ref={contentRef}>
      <AnimatePresence>
        {(pullDistance > 5 || refreshing) && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{ position: "absolute", insetInline: 0, top: 0, zIndex: 10, display: "flex", alignItems: "center", justifyContent: "center", paddingTop: 16, height: refreshing ? threshold : Math.min(pullDistance, threshold) }}
          >
            {refreshing ? (
              <div style={{ width: 20, height: 20, border: "2px solid hsl(var(--primary))", borderTopColor: "transparent", borderRadius: "50%", animation: "spin .6s linear infinite" }} />
            ) : (
              <motion.div animate={{ rotate: pullDistance > threshold * 0.6 ? 180 : 0 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: "hsl(var(--muted-foreground))" }}><polyline points="7 13 12 18 17 13"/><polyline points="7 6 12 11 17 6"/></svg>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div
        onTouchStart={(e) => {
          if (!isAtTop || refreshing) return;
          const touch = e.touches[0];
          const target = e.currentTarget;
          const rect = target.getBoundingClientRect();
          if (touch.clientY - rect.top < 80) target.setAttribute("data-pull-start", String(touch.clientY));
        }}
        onTouchMove={(e) => {
          if (!isAtTop || refreshing) return;
          const startY = e.currentTarget.getAttribute("data-pull-start");
          if (!startY) return;
          const diff = e.touches[0].clientY - Number(startY);
          if (diff > 0) { setPullDistance(diff); if (diff > 15) e.preventDefault(); }
        }}
        onTouchEnd={async () => {
          document.querySelectorAll("[data-pull-start]").forEach(el => el.removeAttribute("data-pull-start"));
          if (pullDistance > threshold) { await doRefresh(); }
          setPullDistance(0);
        }}
        style={{ transform: `translateY(${Math.min(pullDistance, threshold)}px)`, transition: refreshing ? "transform 0.3s ease" : "transform 0.1s ease" }}
      >
        {children}
      </div>
    </div>
  );
}
