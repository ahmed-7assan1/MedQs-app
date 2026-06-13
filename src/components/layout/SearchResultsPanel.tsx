"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  MagnifyingGlassIcon, BookOpenIcon, AcademicCapIcon,
  UserGroupIcon, ChevronRightIcon, XMarkIcon, SparklesIcon,
} from "@heroicons/react/24/solid";

interface SearchResult {
  id: string; label: string; sub: string; href: string; type: string;
}
interface SearchResults {
  users: SearchResult[]; modules: SearchResult[];
  lectures: SearchResult[]; quizzes: SearchResult[];
}
interface Props {
  query: string; isOpen: boolean; onClose: () => void;
}

function useDebounce(value: string, delay: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

const sectionConfig: Record<string, { icon: any; title: string }> = {
  lectures: { icon: BookOpenIcon, title: "Academic Lectures" },
  quizzes:  { icon: SparklesIcon, title: "Assessment Quizzes" },
  modules:  { icon: AcademicCapIcon, title: "Knowledge Modules" },
  users:    { icon: UserGroupIcon, title: "Clinical Peers" },
};

export function SearchResultsPanel({ query, isOpen, onClose }: Props) {
  const router = useRouter();
  const debouncedQuery = useDebounce(query, 300);
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) {
      setResults(null); setLoading(false); return;
    }
    setLoading(true);
    const ctrl = new AbortController();
    fetch(`/api/v1/search?q=${encodeURIComponent(debouncedQuery)}`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((d) => { setResults(d); setLoading(false); })
      .catch((err) => { if (err.name !== "AbortError") setLoading(false); });
    return () => ctrl.abort();
  }, [debouncedQuery]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  const navigate = (href: string) => { onClose(); router.push(href); };

  const totalCount = results
    ? results.lectures.length + results.quizzes.length + results.modules.length + results.users.length
    : 0;

  const sections = [
    { key: "lectures", items: results?.lectures ?? [] },
    { key: "quizzes", items: results?.quizzes ?? [] },
    { key: "modules", items: results?.modules ?? [] },
    { key: "users", items: results?.users ?? [] },
  ] as const;

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/30 dark:bg-black/50 z-[148]"
        onClick={onClose}
      />
      <div
        className="fixed top-[56px] left-0 right-0 bottom-0 z-[149] overflow-y-auto bg-background"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <div className="mx-auto max-w-2xl px-4 py-4">

          {/* Empty state */}
          {(!debouncedQuery || debouncedQuery.length < 2) && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <MagnifyingGlassIcon className="h-10 w-10 text-muted-foreground/30 mb-4" />
              <p className="text-sm font-medium text-muted-foreground">Type to search lectures, quizzes, modules, and peers</p>
            </div>
          )}

          {/* Loading */}
          {debouncedQuery && debouncedQuery.length >= 2 && loading && (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="h-8 w-8 rounded-full border-2 border-muted/20 border-t-primary animate-spin mb-3" />
              <p className="text-sm text-muted-foreground">Searching&hellip;</p>
            </div>
          )}

          {/* No results */}
          {debouncedQuery && debouncedQuery.length >= 2 && !loading && totalCount === 0 && results !== null && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <XMarkIcon className="h-10 w-10 text-muted-foreground/30 mb-4" />
              <p className="text-sm font-medium text-foreground">No results for &quot;{debouncedQuery}&quot;</p>
              <p className="text-sm text-muted-foreground mt-1">Try a different search term</p>
            </div>
          )}

          {/* Results */}
          {debouncedQuery && debouncedQuery.length >= 2 && !loading && totalCount > 0 && (
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
                        <button
                          key={item.id}
                          onClick={() => navigate(item.href)}
                          className="w-full flex items-center gap-3 rounded-xl border border-border bg-card/50 px-3.5 py-3 text-left hover:bg-card transition-colors"
                        >
                          <div className="h-8 w-8 shrink-0 rounded-lg bg-muted/10 flex items-center justify-center">
                            <Icon className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{item.label}</p>
                            <p className="text-xs text-muted-foreground truncate">{item.sub}</p>
                          </div>
                          <ChevronRightIcon className="h-4 w-4 shrink-0 text-muted-foreground/30" />
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
