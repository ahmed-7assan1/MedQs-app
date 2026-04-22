"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X, Loader2, User, BookOpen, Layers, FileText } from "lucide-react";

type Hit = { id: string; label: string; sub: string; href: string };

type SearchResponse = {
  users: Hit[];
  modules: Hit[];
  lectures: Hit[];
  quizzes: Hit[];
};

const headerSearchBtnClass =
  "relative flex h-8 shrink-0 items-center gap-2 rounded-lg border border-white/[0.05] bg-muted/40 px-2.5 text-muted-foreground transition-all hover:bg-muted hover:text-foreground active:scale-[0.97] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/50 max-lg:px-2";

export function GlobalSearch({ isGuest }: { isGuest?: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<SearchResponse | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runSearch = useCallback(async (query: string) => {
    if (query.trim().length < 2) {
      setData(null);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/search?q=${encodeURIComponent(query.trim())}`, { credentials: "include" });
      const json = (await res.json().catch(() => ({}))) as SearchResponse & { error?: string };
      if (!res.ok) {
        setData({ users: [], modules: [], lectures: [], quizzes: [] });
        return;
      }
      setData({
        users: Array.isArray(json.users) ? json.users : [],
        modules: Array.isArray(json.modules) ? json.modules : [],
        lectures: Array.isArray(json.lectures) ? json.lectures : [],
        quizzes: Array.isArray(json.quizzes) ? json.quizzes : [],
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    const t = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(t);
  }, [open]);

  useEffect(() => {
    if (!open || isGuest) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void runSearch(q);
    }, 280);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [q, open, isGuest, runSearch]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (!isGuest) setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isGuest]);

  function go(href: string) {
    setOpen(false);
    setQ("");
    setData(null);
    router.push(href);
  }

  if (isGuest) {
    return null;
  }

  const sections: { title: string; icon: typeof User; items: Hit[] }[] = data
    ? [
        { title: "People", icon: User, items: data.users },
        { title: "Modules", icon: Layers, items: data.modules },
        { title: "Lectures", icon: BookOpen, items: data.lectures },
        { title: "Quizzes", icon: FileText, items: data.quizzes },
      ]
    : [];

  const totalHits = sections.reduce((n, s) => n + s.items.length, 0);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={headerSearchBtnClass}
        aria-haspopup="dialog"
        aria-label="Open search"
        title="Search (Ctrl+K)"
      >
        <Search className="h-[18px] w-[18px]" aria-hidden />
        <span className="hidden text-xs text-muted-foreground lg:inline">Search</span>
        <kbd className="hidden rounded border border-border bg-muted/80 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground lg:inline">
          ⌘K
        </kbd>
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-[1100] flex items-start justify-center bg-black/40 px-3 pt-[12vh] dark:bg-black/70 md:pt-[10vh]"
          role="dialog"
          aria-label="Site search"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
              <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Name, student ID, module, lecture, quiz…"
                className="min-w-0 flex-1 border-0 bg-transparent py-1 text-sm outline-none placeholder:text-muted-foreground"
                autoComplete="off"
              />
              {loading ? <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" aria-hidden /> : null}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Close search"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="max-h-[min(50vh,420px)] overflow-y-auto p-2">
              {q.trim().length < 2 ? (
                <p className="px-2 py-6 text-center text-sm text-muted-foreground">Type at least 2 characters.</p>
              ) : !loading && totalHits === 0 ? (
                <p className="px-2 py-6 text-center text-sm text-muted-foreground">No matches.</p>
              ) : (
                sections.map((sec) =>
                  sec.items.length === 0 ? null : (
                    <div key={sec.title} className="mb-3 last:mb-0">
                      <p className="mb-1 flex items-center gap-1.5 px-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        <sec.icon className="h-3 w-3" aria-hidden />
                        {sec.title}
                      </p>
                      <ul className="space-y-0.5">
                        {sec.items.map((item) => (
                          <li key={`${sec.title}-${item.id}`}>
                            <button
                              type="button"
                              onClick={() => go(item.href)}
                              className="flex w-full flex-col items-start rounded-xl px-3 py-2 text-left text-sm transition-colors hover:bg-muted"
                            >
                              <span className="font-medium text-foreground">{item.label}</span>
                              <span className="text-xs text-muted-foreground">{item.sub}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )
                )
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
