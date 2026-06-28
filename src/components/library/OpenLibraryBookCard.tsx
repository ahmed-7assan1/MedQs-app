"use client";

import { motion } from "framer-motion";

export interface OpenLibraryBook {
  key: string;
  title: string;
  author_name: string[];
  cover_i: number | null;
  first_publish_year: number | null;
  subject: string[];
  edition_count: number;
  has_fulltext: boolean;
  ebook_access: "borrowable" | "public" | "no_ebook";
  ia: string[] | null;
}

interface Props {
  book: OpenLibraryBook;
  index: number;
  onSelect: (book: OpenLibraryBook) => void;
}

function coverUrl(cover_i: number | null): string | null {
  return cover_i ? `https://covers.openlibrary.org/b/id/${cover_i}-M.jpg` : null;
}

export function OpenLibraryBookCard({ book, index, onSelect }: Props) {
  const img = coverUrl(book.cover_i);
  const year = book.first_publish_year || "—";

  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      onClick={() => onSelect(book)}
      className="group flex gap-4 p-4 rounded-2xl border border-border bg-card hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all text-left w-full"
    >
      <div className="flex-shrink-0 w-[72px] h-[108px] rounded-lg overflow-hidden bg-muted shadow-sm">
        {img ? (
          <img
            src={img}
            alt={book.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
            </svg>
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">
          {book.title}
        </h3>
        <p className="text-xs text-muted-foreground mt-1 truncate">
          {book.author_name?.join(", ") || "Unknown author"}
        </p>
        <div className="flex items-center gap-3 mt-2">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{year}</span>
          {book.ia != null && book.ia.length > 0 && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-sky-500/10 text-sky-500 text-[9px] font-bold uppercase tracking-wider">
              read
            </span>
          )}
          {!book.ia?.length && book.has_fulltext && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-green-500/10 text-green-500 text-[9px] font-bold uppercase tracking-wider">
              free
            </span>
          )}
          {book.ebook_access === "borrowable" && !book.ia?.length && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-500 text-[9px] font-bold uppercase tracking-wider">
              borrow
            </span>
          )}
        </div>
      </div>
    </motion.button>
  );
}
