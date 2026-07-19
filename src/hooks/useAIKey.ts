"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/components/providers/SupabaseAuthProvider";

type ProviderKeys = Record<string, string>;

const CACHE_KEY = "medqs-ai-keys-v1";

export function useAIKey() {
  const { user } = useAuth();
  const userId = user?.id;

  const [keys, setKeys] = useState<ProviderKeys | null>(null);
  const [loading, setLoading] = useState(true);
  const fetchedRef = useRef(false);

  const fetchKeys = useCallback(async () => {
    if (!userId) {
      setKeys(null);
      setLoading(false);
      return;
    }

    // Check localStorage cache first
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached) as { userId: string; keys: ProviderKeys; ts: number };
        if (parsed.userId === userId && Date.now() - parsed.ts < 5 * 60 * 1000) {
          setKeys(parsed.keys);
          setLoading(false);
          return;
        }
      }
    } catch {}

    // Fetch from server
    try {
      const res = await fetch("/api/v1/user/ai-keys/fetch", { method: "POST" });
      if (!res.ok) {
        setKeys(null);
        setLoading(false);
        return;
      }
      const data = await res.json();
      const providerKeys: ProviderKeys = data.keys ?? {};

      setKeys(providerKeys);

      // Cache in localStorage
      try {
        localStorage.setItem(
          CACHE_KEY,
          JSON.stringify({ userId, keys: providerKeys, ts: Date.now() })
        );
      } catch {}
    } catch {
      setKeys(null);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    fetchKeys();
  }, [fetchKeys]);

  // Clear cache when user changes
  useEffect(() => {
    fetchedRef.current = false;
    setKeys(null);
    setLoading(true);
  }, [userId]);

  const getKey = useCallback(
    (provider: string): string | null => keys?.[provider] ?? null,
    [keys]
  );

  const hasAnyKey = keys !== null && Object.keys(keys).length > 0;
  const ready = !loading;

  const refresh = useCallback(() => {
    fetchedRef.current = false;
    setLoading(true);
    fetchKeys();
  }, [fetchKeys]);

  return { getKey, hasAnyKey, ready, keys, loading, refresh };
}
