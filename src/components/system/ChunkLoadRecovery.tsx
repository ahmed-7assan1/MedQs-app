"use client";

import { useEffect } from "react";

/**
 * After `next dev` rebuilds or `.next` is cleared, the browser may still request old chunk URLs → ChunkLoadError.
 * One full reload usually fetches a fresh document with up-to-date chunk names.
 */
export function ChunkLoadRecovery() {
  useEffect(() => {
    let reloaded = false;

    function maybeReload(message: string) {
      if (reloaded) return;
      if (
        message.includes("ChunkLoadError") ||
        message.includes("Loading chunk") ||
        message.includes("Failed to fetch dynamically imported module")
      ) {
        reloaded = true;
        window.location.reload();
      }
    }

    function onWindowError(event: ErrorEvent) {
      maybeReload(String(event.message ?? ""));
    }

    function onUnhandledRejection(event: PromiseRejectionEvent) {
      const r = event.reason;
      const msg =
        r instanceof Error ? r.message : typeof r === "string" ? r : String(r ?? "");
      maybeReload(msg);
    }

    window.addEventListener("error", onWindowError);
    window.addEventListener("unhandledrejection", onUnhandledRejection);
    return () => {
      window.removeEventListener("error", onWindowError);
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
    };
  }, []);

  return null;
}
