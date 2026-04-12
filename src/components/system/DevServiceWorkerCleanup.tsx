"use client";

import { useEffect } from "react";

/**
 * After `next start` / a production build, the browser keeps Workbox registered.
 * Running `next dev` afterward still uses that SW: it caches old `/_next/static/...`
 * chunk names → 404 + blank white pages. Dev must not use a stale PWA worker.
 */
export function DevServiceWorkerCleanup() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;

    void navigator.serviceWorker
      .getRegistrations()
      .then((regs) => {
        for (const r of regs) void r.unregister();
      })
      .catch(() => {});

    if ("caches" in window) {
      void caches.keys().then((keys) => {
        for (const k of keys) void caches.delete(k);
      });
    }
  }, []);

  return null;
}
