import { waitUntil } from "@vercel/functions";

export function defer(fn: () => Promise<unknown>) {
  try {
    waitUntil(fn().catch((err) => {
      if (process.env.NODE_ENV === "development") {
        console.warn("[defer] task failed:", err instanceof Error ? err.message : err);
      }
    }));
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[defer] waitUntil unavailable:", err instanceof Error ? err.message : err);
    }
  }
}
