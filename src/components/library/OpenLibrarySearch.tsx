"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Search, X, BookOpen, Loader2 } from "lucide-react";
import { OpenLibraryBookCard, type OpenLibraryBook } from "./OpenLibraryBookCard";
import { OpenLibraryBookModal } from "./OpenLibraryBookModal";

const SUBJECTS = [
  { label: "All Medical", value: "medicine" },
  { label: "Anatomy", value: "anatomy" },
  { label: "Physiology", value: "physiology" },
  { label: "Pharmacology", value: "pharmacology" },
  { label: "Pathology", value: "pathology" },
  { label: "Surgery", value: "surgery" },
  { label: "Cardiology", value: "cardiology" },
  { label: "Pediatrics", value: "pediatrics" },
  { label: "Neurology", value: "neurology" },
  { label: "Microbiology", value: "microbiology" },
  { label: "Biochemistry", value: "biochemistry" },
];

export function OpenLibrarySearch() {
  const [query, setQuery] = useState("");
  const [subject, setSubject] = useState("medicine");
  const [books, setBooks] = useState<OpenLibraryBook[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [selectedBook, setSelectedBook] = useState<OpenLibraryBook | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const search = useCallback(async (q: string, sub: string, pg: number) => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());
      if (sub) params.set("subject", sub);
      params.set("page", pg.toString());
      params.set("limit", "24");

      const res = await fetch(`/api/v1/openlibrary/search?${params.toString()}`);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Search failed");
      }

      const data = await res.json();
      if (pg === 1) {
        setBooks(data.docs || []);
      } else {
        setBooks((prev) => [...prev, ...(data.docs || [])]);
      }
      setTotal(data.total || 0);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
      if (pg === 1) setBooks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    search("", "medicine", 1);
  }, [search]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    search(query, subject, 1);
  }

  function handleSubjectClick(sub: string) {
    setSubject(sub);
    setPage(1);
    search(query, sub, 1);
    inputRef.current?.focus();
  }

  function handleLoadMore() {
    const nextPage = page + 1;
    setPage(nextPage);
    search(query, subject, nextPage);
  }

  function handleClear() {
    setQuery("");
    setSubject("medicine");
    setPage(1);
    search("", "medicine", 1);
    inputRef.current?.focus();
  }

  function handleSelectBook(book: OpenLibraryBook) {
    setSelectedBook(book);
    setModalOpen(true);
  }

  const hasActiveFilter = query.trim() || subject;
  const hasMore = books.length < total && books.length >= 24;

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="mb-8">
        <form onSubmit={handleSearch} className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search medical textbooks, references, and more..."
            className="w-full h-14 pl-12 pr-20 rounded-2xl border border-border bg-card text-foreground placeholder:text-muted-foreground/60 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {query && (
              <button
                type="button"
                onClick={() => { setQuery(""); inputRef.current?.focus(); }}
                className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
              >
                <X size={16} />
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className="h-9 px-4 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : "Search"}
            </button>
          </div>
        </form>

        <div className="flex flex-wrap gap-2 mt-4">
          {SUBJECTS.map((s) => (
            <button
              key={s.value}
              onClick={() => handleSubjectClick(s.value)}
              className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${
                subject === s.value
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {hasActiveFilter && (
          <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground">
            <span>
              {total > 0
                ? `Found ${total.toLocaleString()} medical book${total !== 1 ? "s" : ""}`
                : "Searching..."}
            </span>
            <button
              onClick={handleClear}
              className="ml-auto inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-muted hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
            >
              <X size={12} />
              Clear filters
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-500 mb-6">
          {error}
        </div>
      )}

      {!loading && books.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <BookOpen size={48} className="mb-4 opacity-30" />
          <p className="text-sm font-medium">No medical books found</p>
          <p className="text-xs mt-1 opacity-60">Try a different search term or subject</p>
        </div>
      )}

      {books.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {books.map((book, i) => (
              <OpenLibraryBookCard
                key={`${book.key}-${i}`}
                book={book}
                index={i}
                onSelect={handleSelectBook}
              />
            ))}
          </div>

          {hasMore && (
            <div className="flex justify-center mt-8">
              <button
                onClick={handleLoadMore}
                disabled={loading}
                className="h-11 px-8 rounded-xl border border-border bg-card text-sm font-bold text-foreground hover:bg-muted hover:border-primary/30 disabled:opacity-50 transition-all inline-flex items-center gap-2"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : null}
                {loading ? "Loading..." : `Load more (${books.length} of ${total.toLocaleString()})`}
              </button>
            </div>
          )}
        </>
      )}

      <OpenLibraryBookModal
        book={selectedBook}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </div>
  );
}
