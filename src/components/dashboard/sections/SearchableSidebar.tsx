"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { Search, X, BookOpen, Folder, HelpCircle, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { SiteSectionsTrigger } from "@/components/dashboard/sections/SiteSectionsModal";

interface SearchResults {
  lectures: { label: string; href: string }[];
  modules: { label: string; href: string }[];
  quizzes: { label: string; href: string }[];
  users: { label: string; href: string }[];
}

export function SearchableSidebar({ children }: { children: React.ReactNode }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchData, setSearchData] = useState<SearchResults | null>(null);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController>();

  const handleSearch = useCallback((val: string) => {
    setSearchQuery(val);
    if (val.length < 3) {
      setSearchData(null);
      setSearching(false);
      return;
    }
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setSearching(true);
    fetch(`/api/v1/search?q=${encodeURIComponent(val)}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((data) => {
        setSearchData({
          lectures: (data.lectures || []).slice(0, 4),
          modules: (data.modules || []).slice(0, 4),
          quizzes: (data.quizzes || []).slice(0, 4),
          users: (data.users || []).slice(0, 4),
        });
      })
      .catch(() => {})
      .finally(() => setSearching(false));
  }, []);

  const openSearch = () => {
    setOpen(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const closeSearch = () => {
    setOpen(false);
    setSearchQuery("");
    setSearchData(null);
    setSearching(false);
  };

  const sections = searchData
    ? [
        { key: "lectures", label: "Lectures", icon: BookOpen, items: searchData.lectures, color: "var(--search-result-lecture)" },
        { key: "modules", label: "Modules", icon: Folder, items: searchData.modules, color: "var(--search-result-module)" },
        { key: "quizzes", label: "Quizzes", icon: HelpCircle, items: searchData.quizzes, color: "var(--search-result-quiz)" },
        { key: "users", label: "Users", icon: Users, items: searchData.users, color: "var(--search-result-user)" },
      ].filter((s) => s.items.length > 0)
    : [];

  return (
    <>
      <div className="relative">
        {open ? (
          <>
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <Input
              ref={inputRef}
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search lectures, modules..."
              className="pl-8 pr-8 min-h-11 rounded-xl border-border/40 bg-card/60 text-xs placeholder:text-muted-foreground focus-visible:ring-primary/30"
            />
            <button onClick={closeSearch} className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center justify-center h-9 w-9 text-muted-foreground hover:text-muted-foreground transition-colors">
              <X className="h-3.5 w-3.5" />
            </button>
            {searching && (
              <div className="absolute bottom-0 left-2 right-2 h-0.5 overflow-hidden rounded-full bg-muted">
                <div className="h-full w-full rounded-full bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_100%] animate-loading-bar" />
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center gap-2">
            <button onClick={openSearch} className="flex-1 flex items-center gap-2 min-h-11 px-2.5 rounded-xl border border-border/40 bg-card/60 text-xs text-muted-foreground hover:text-muted-foreground/70 hover:bg-card/80 transition-all">
              <Search className="h-3.5 w-3.5 shrink-0" />
              <span>Search lectures...</span>
            </button>
            <SiteSectionsTrigger />
          </div>
        )}
      </div>

      {open && searchQuery.length >= 3 ? (
        <div className="space-y-4">
          {sections.length > 0 ? (
            sections.map((section) => {
              const Icon = section.icon;
              return (
                <div key={section.key}>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Icon className="h-3 w-3" style={{ color: `hsl(${section.color})` }} />
                    <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">{section.label}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    {section.items.map((item: any, idx: number) => (
                      <Link
                        key={idx}
                        href={item.href || "#"}
                        onClick={closeSearch}
                        className="flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-muted/40 transition-all text-xs font-medium text-foreground"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })
          ) : !searching && searchData ? (
            <p className="text-xs text-muted-foreground text-center py-8">No results found</p>
          ) : searching ? (
            <p className="text-xs text-muted-foreground text-center py-8">Searching...</p>
          ) : null}
        </div>
      ) : open && searchQuery.length > 0 && searchQuery.length < 3 ? (
        <p className="text-xs text-muted-foreground text-center py-8">Type at least 3 characters</p>
      ) : (
        children
      )}
    </>
  );
}
