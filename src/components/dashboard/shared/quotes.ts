export interface Quote {
  text: string;
  author: string;
}

export const MEDICAL_QUOTES: Quote[] = [
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

export function getDailyQuote(): Quote {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );
  return MEDICAL_QUOTES[dayOfYear % MEDICAL_QUOTES.length];
}
