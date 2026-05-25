"use client";

import type { OpenLibraryBook } from "./OpenLibraryBookCard";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ExternalLink, BookOpen, Calendar, User, Hash, Layers, BookMarked } from "lucide-react";
import Link from "next/link";

interface Props {
  book: OpenLibraryBook | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function coverUrl(cover_i: number | null): string | null {
  return cover_i ? `https://covers.openlibrary.org/b/id/${cover_i}-L.jpg` : null;
}

function readerSlug(key: string): string {
  return key.replace(/^\//, "").replace(/\//g, "_");
}

export function OpenLibraryBookModal({ book, open, onOpenChange }: Props) {
  if (!book) return null;

  const img = coverUrl(book.cover_i);
  const openLibraryUrl = `https://openlibrary.org${book.key}`;
  const hasEbook = book.has_fulltext || book.ebook_access === "public" || book.ebook_access === "borrowable";
  const canReadDirectly = book.ia?.length > 0;
  const readerUrl = `/medical-books/read/${readerSlug(book.key)}?ia=${book.ia?.[0]}&title=${encodeURIComponent(book.title)}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">{book.title}</DialogTitle>
          <DialogDescription>
            {book.author_name?.join(", ") || "Unknown author"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col sm:flex-row gap-6 mt-2">
          <div className="flex-shrink-0 mx-auto sm:mx-0">
            {img ? (
              <img
                src={img}
                alt={book.title}
                className="w-[128px] h-[192px] rounded-lg object-cover shadow-md"
              />
            ) : (
              <div className="w-[128px] h-[192px] rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                <BookOpen size={40} />
              </div>
            )}
          </div>

          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User size={14} />
              <span className="font-medium text-foreground">{book.author_name?.join(", ") || "Unknown"}</span>
            </div>

            {book.first_publish_year && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar size={14} />
                <span>First published in <span className="font-medium text-foreground">{book.first_publish_year}</span></span>
              </div>
            )}

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Layers size={14} />
              <span><span className="font-medium text-foreground">{book.edition_count}</span> editions</span>
            </div>

            {book.ia?.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <BookMarked size={14} />
                <span className="text-green-600 dark:text-green-400 font-medium">Digitized version available</span>
              </div>
            )}

            {book.subject && book.subject.length > 0 && (
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <Hash size={14} className="mt-0.5 flex-shrink-0" />
                <div className="flex flex-wrap gap-1">
                  {book.subject.slice(0, 6).map((s) => (
                    <span key={s} className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-semibold uppercase tracking-wider">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {hasEbook && (
          <div className="mt-4 p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-sm text-green-600 dark:text-green-400">
            This book is available for free reading online.
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          {canReadDirectly ? (
            <Link
              href={readerUrl}
              className="flex-1 inline-flex items-center justify-center gap-2 h-11 px-4 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors"
            >
              <BookOpen size={16} />
              Read Online
            </Link>
          ) : null}
          <a
            href={openLibraryUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center justify-center gap-2 h-11 px-4 rounded-xl font-bold text-sm transition-colors ${
              canReadDirectly
                ? "flex-[0.5] border border-border bg-card text-foreground hover:bg-muted"
                : "flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
            }`}
          >
            <ExternalLink size={16} />
            View on Open Library
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
}
