"use client";

import { useEffect, useRef } from "react";

export function useScrollPreservation() {
  const scrollRef = useRef(0);

  useEffect(() => {
    const save = () => {
      scrollRef.current = window.scrollY;
    };

    const restore = () => {
      if (document.visibilityState === "visible") {
        requestAnimationFrame(() => {
          window.scrollTo(0, scrollRef.current);
        });
      }
    };

    document.addEventListener("visibilitychange", save);
    document.addEventListener("visibilitychange", restore);
    window.addEventListener("beforeunload", save);

    return () => {
      document.removeEventListener("visibilitychange", save);
      document.removeEventListener("visibilitychange", restore);
      window.removeEventListener("beforeunload", save);
    };
  }, []);
}
