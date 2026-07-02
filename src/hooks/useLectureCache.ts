"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getCachedLecture,
  setCachedLecture,
  setCachedMeta,
  getCachedItems,
  setCachedItems,
  isLectureExpired,
} from "@/lib/db/medonix-cache";
import type { LectureCache, LectureItems } from "@/lib/db/medonix-cache.types";

interface UseLectureCacheResult {
  lecture: LectureCache | null;
  items: Record<string, LectureItems | null>;
  loading: boolean;
  error: string | null;
  fromCache: boolean;
  refresh: () => Promise<void>;
}

export function useLectureCache(lectureId: string, skipServerFetch?: boolean): UseLectureCacheResult {
  const [lecture, setLecture] = useState<LectureCache | null>(null);
  const [items, setItems] = useState<Record<string, LectureItems | null>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fromCache, setFromCache] = useState(false);

  const fetchAndCache = useCallback(async () => {
    if (!lectureId) return;
    setLoading(true);
    setError(null);

    try {
      const cached = await getCachedLecture(lectureId);
      const expired = cached ? await isLectureExpired(cached) : true;

      if (cached && !expired) {
        setLecture(cached);
        setFromCache(true);
        setLoading(false);
        return;
      }

      const versionRes = await fetch(`/api/v1/lectures/${lectureId}/version`);
      if (!versionRes.ok) {
        if (cached) {
          setLecture(cached);
          setFromCache(true);
          setLoading(false);
          return;
        }
        throw new Error(`Version check failed: ${versionRes.status}`);
      }

      const remoteMeta = await versionRes.json();

      if (cached && cached.version === remoteMeta.version) {
        await setCachedMeta({
          lectureId,
          version: remoteMeta.version,
          updatedAt: remoteMeta.updatedAt,
          components: { content: remoteMeta.version, items: remoteMeta.version, transcript: remoteMeta.version },
        });
        const refreshed = { ...cached, cachedAt: Date.now() };
        await setCachedLecture(refreshed);
        setLecture(refreshed);
        setFromCache(true);
        setLoading(false);
        return;
      }

      const [contentRes] = await Promise.all([
        fetch(`/api/v1/lectures/${lectureId}/content`),
      ]);

      if (!contentRes.ok) {
        if (cached) {
          setLecture(cached);
          setFromCache(true);
          setLoading(false);
          return;
        }
        throw new Error(`Content fetch failed: ${contentRes.status}`);
      }

      const contentData = await contentRes.json();
      const lectureData: LectureCache = {
        lectureId: contentData.lectureId,
        version: contentData.version,
        updatedAt: contentData.updatedAt,
        cachedAt: Date.now(),
        title: contentData.title,
        summary: contentData.summary,
        content: contentData.content,
        transcript: contentData.transcript,
      };

      await setCachedLecture(lectureData);
      await setCachedMeta({
        lectureId,
        version: contentData.version,
        updatedAt: contentData.updatedAt,
        components: { content: contentData.version, items: contentData.version, transcript: contentData.version },
      });

      setLecture(lectureData);
      setFromCache(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load lecture";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [lectureId]);

  const fetchItems = useCallback(async (itemType: LectureItems["itemType"]) => {
    if (!lectureId) return;
    try {
      const cached = await getCachedItems(lectureId, itemType);
      if (cached) {
        setItems(prev => ({ ...prev, [itemType]: cached }));
        return;
      }

      const res = await fetch(`/api/v1/lectures/${lectureId}/items?type=${itemType}`);
      if (!res.ok) return;

      const data = await res.json();
      const itemsData: LectureItems = {
        lectureId: data.lectureId,
        itemType: data.itemType,
        version: data.version,
        items: data.items,
      };

      await setCachedItems(itemsData);
      setItems(prev => ({ ...prev, [itemType]: itemsData }));
    } catch {
      // silently fail for items — lecture content is the priority
    }
  }, [lectureId]);

  useEffect(() => {
    fetchAndCache();
  }, [fetchAndCache]);

  return {
    lecture,
    items,
    loading,
    error,
    fromCache,
    refresh: fetchAndCache,
  };
}
