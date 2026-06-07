"use client";

import { useEffect, useState } from "react";
import { Quote } from "lucide-react";

const QUOTES = [
  { text: "The art of medicine consists of amusing the patient while nature cures the disease.", author: "Voltaire" },
  { text: "Wherever the art of medicine is loved, there is also a love of humanity.", author: "Hippocrates" },
  { text: "Medicine is a science of uncertainty and an art of probability.", author: "William Osler" },
  { text: "The good physician treats the disease; the great physician treats the patient who has the disease.", author: "William Osler" },
  { text: "He who studies medicine without books sails an uncharted sea.", author: "William Osler" },
  { text: "The best doctor is the one you run to and can't find.", author: "Denis Diderot" },
  { text: "Let food be thy medicine and medicine be thy food.", author: "Hippocrates" },
  { text: "Cure sometimes, treat often, comfort always.", author: "Hippocrates" },
  { text: "The physician's highest calling is to find health and make it possible.", author: "Norman Cousins" },
  { text: "In nothing do men more nearly approach the gods than in giving health to men.", author: "Cicero" },
  { text: "A physician is obligated to consider more than a diseased organ, more than the whole man — he must view the man in his world.", author: "Harvey Cushing" },
  { text: "The aim of medicine is to prevent disease and prolong life; the ideal of medicine is to eliminate the need of a physician.", author: "William J. Mayo" },
  { text: "It is more important to know what sort of person has a disease than to know what sort of disease a person has.", author: "Hippocrates" },
  { text: "Time is generally the best doctor.", author: "Ovid" },
  { text: "The practice of medicine is an art, not a trade; a calling, not a business.", author: "William Osler" },
];

export const DailyQuote = () => {
  const [quote, setQuote] = useState<{ text: string; author: string } | null>(null);

  useEffect(() => {
    const today = new Date().toDateString();
    const saved = sessionStorage.getItem("dash-quote");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.date === today) {
          setQuote(parsed.quote);
          return;
        }
      } catch {}
    }
    const idx = Math.floor(Math.random() * QUOTES.length);
    const selected = QUOTES[idx];
    sessionStorage.setItem("dash-quote", JSON.stringify({ date: today, quote: selected }));
    setQuote(selected);
  }, []);

  if (!quote) return null;

  return (
    <div className="dash-sidebar-card">
      <div className="flex items-start gap-3">
        <Quote size={16} className="text-primary shrink-0 mt-0.5" />
        <p className="text-xs leading-relaxed text-foreground/70 italic">&ldquo;{quote.text}&rdquo;</p>
      </div>
      <p className="mt-2 text-[10px] font-bold text-foreground/40 text-right tracking-wider">&mdash; {quote.author}</p>
    </div>
  );
};
