import { useEffect, useState, useRef, useCallback } from "react";

interface UseLazyFetchOptions<T = any> {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
  onData?: (data: T) => void;
}

export function useLazyFetch<T = any>(
  url: string | null,
  options: UseLazyFetchOptions<T> = {}
) {
  const { threshold = 0, rootMargin = "200px", triggerOnce = true, onData } = options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shouldFetch, setShouldFetch] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldFetch(true);
          if (triggerOnce) observer.unobserve(el);
        } else if (!triggerOnce) {
          setShouldFetch(false);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, rootMargin, triggerOnce]);

  useEffect(() => {
    if (!shouldFetch || !url) return;
    setLoading(true);
    setError(null);
    fetch(url)
      .then((r) => (r.ok ? r.json() : Promise.reject("Failed to fetch")))
      .then((d) => { setData(d); onData?.(d); })
      .catch((err) => setError(err?.message || String(err)))
      .finally(() => setLoading(false));
  }, [shouldFetch, url]);

  return { ref, data, loading, error };
}
