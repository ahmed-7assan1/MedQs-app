"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { Play } from "@phosphor-icons/react";

const EXCLUDED_PATHS = ["/", "/login", "/register", "/forgot-password", "/reset-password", "/complete-profile", "/auth"];

export function SessionPersistence() {
  const pathname = usePathname();
  const router = useRouter();
  const [hasResumed, setHasResumed] = useState(false);

  // 1. Save current path
  useEffect(() => {
    if (pathname && !EXCLUDED_PATHS.includes(pathname)) {
      localStorage.setItem("medqs-last-path", pathname);
    }
  }, [pathname]);

  // 2. Offer to resume on home/landing
  useEffect(() => {
    if (pathname === "/" && !hasResumed) {
      const lastPath = localStorage.getItem("medqs-last-path");
      
      if (lastPath && lastPath !== "/") {
        // We use a delay to ensure the landing page is rendered and Toast container is ready
        const timer = setTimeout(() => {
          toast((t) => (
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <p className="font-bold text-sm">Resume your MedOneX session?</p>
                <p className="text-xs opacity-60 truncate max-w-[200px]">{lastPath}</p>
              </div>
              <button
                onClick={() => {
                  toast.dismiss(t.id);
                  router.push(lastPath);
                  setHasResumed(true);
                }}
                className="flex items-center gap-2 px-3 py-2 bg-primary text-white rounded-lg text-xs font-bold hover:scale-105 transition-transform"
              >
                <Play weight="fill" />
                Resume
              </button>
            </div>
          ), {
            duration: 8000,
            id: "resume-session",
          });
        }, 2000);

        return () => clearTimeout(timer);
      }
    }
  }, [pathname, router, hasResumed]);

  return null;
}
