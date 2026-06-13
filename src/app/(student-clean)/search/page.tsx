"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  MagnifyingGlassIcon, BookOpenIcon, AcademicCapIcon, UserGroupIcon,
  ChevronRightIcon, XMarkIcon, SparklesIcon,
} from "@heroicons/react/24/solid";

interface SearchResult {
  id: string; label: string; sub: string; href: string; type: string;
}
interface SearchResults {
  users: SearchResult[]; modules: SearchResult[];
  lectures: SearchResult[]; quizzes: SearchResult[];
}

const sectionConfig: Record<string, { icon: any; title: string }> = {
  lectures: { icon: BookOpenIcon, title: "Academic Lectures" },
  quizzes:  { icon: SparklesIcon, title: "Assessment Quizzes" },
  modules:  { icon: AcademicCapIcon, title: "Knowledge Modules" },
  users:    { icon: UserGroupIcon, title: "Clinical Peers" },
};

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get("q") || "";
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    if (!query || query.length < 2) {
      setResults(null); setLoading(false); return;
    }
    setLoading(true);
    const ctrl = new AbortController();
    fetch(`/api/v1/search?q=${encodeURIComponent(query)}`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((d) => { setResults(d); setLoading(false); })
      .catch((err) => { if (err.name !== "AbortError") setLoading(false); });
    return () => ctrl.abort();
  }, [query]);

  const totalCount = results
    ? results.lectures.length + results.quizzes.length + results.modules.length + results.users.length
    : 0;

  useEffect(() => {
    if (query && query !== initialQuery) {
      const url = new URL(window.location.href);
      url.searchParams.set("q", query);
      window.history.replaceState({}, "", url.toString());
    }
  }, [query]);

  const sections = [
    { key: "lectures", items: results?.lectures ?? [] },
    { key: "quizzes", items: results?.quizzes ?? [] },
    { key: "modules", items: results?.modules ?? [] },
    { key: "users", items: results?.users ?? [] },
  ] as const;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-2xl px-4 pt-4 pb-32">
        {/* Search Bar */}
        <div className="relative mb-6">
          <div className="flex items-center gap-3 rounded-xl border border-border bg-card/50 px-4 py-3 transition-all focus-within:border-primary/50">
            <MagnifyingGlassIcon className="h-5 w-5 shrink-0 text-muted-foreground" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search courses, videos, people..."
              className="flex-1 bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground/50"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="shrink-0 p-1 rounded-full hover:bg-muted/20 transition-colors text-muted-foreground"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        {(!query || query.length < 2) ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <MagnifyingGlassIcon className="h-10 w-10 text-muted-foreground/30 mb-4" />
            <p className="text-sm text-muted-foreground">Search across lectures, quizzes, modules, and peers</p>
          </div>
        ) : loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="h-8 w-8 rounded-full border-2 border-muted/20 border-t-primary animate-spin mb-3" />
            <p className="text-sm text-muted-foreground">Searching&hellip;</p>
          </div>
        ) : totalCount === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <XMarkIcon className="h-10 w-10 text-muted-foreground/30 mb-4" />
            <p className="text-sm font-medium text-foreground">No results for &quot;{query}&quot;</p>
            <p className="text-sm text-muted-foreground mt-1">Try a different search term</p>
          </div>
        ) : (
          <div>
            <p className="text-xs text-muted-foreground mb-4">{totalCount} result{totalCount !== 1 ? "s" : ""}</p>
            {sections.map((section) => {
              if (section.items.length === 0) return null;
              const config = sectionConfig[section.key];
              const Icon = config.icon;
              return (
                <div key={section.key} className="mb-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <h3 className="text-xs font-semibold text-muted-foreground">{config.title}</h3>
                    <span className="text-xs text-muted-foreground/50 ml-auto">{section.items.length}</span>
                  </div>
                  <div className="space-y-1">
                    {section.items.map((item) => (
                      <a
                        key={item.id}
                        href={item.href}
                        className="flex items-center gap-3 rounded-xl border border-border bg-card/50 px-3.5 py-3 hover:bg-card transition-colors"
                      >
                        <div className="h-8 w-8 shrink-0 rounded-lg bg-muted/10 flex items-center justify-center">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{item.label}</p>
                          <p className="text-xs text-muted-foreground truncate">{item.sub}</p>
                        </div>
                        <ChevronRightIcon className="h-4 w-4 shrink-0 text-muted-foreground/30" />
                      </a>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-muted/20 border-t-primary animate-spin" />
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
