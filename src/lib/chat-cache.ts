"use client";

import { normalizeQuestion, hashQuestion } from "./normalize-question";

const DB_NAME = "medqs-chat-cache";
const STORE_NAME = "responses";
const DB_VERSION = 1;
const MAX_ENTRIES = 500;
const TTL_MS = 48 * 60 * 60 * 1000; // 48 hours

type CacheEntry = {
  key: string;
  response: string;
  timestamp: number;
};

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "key" });
        store.createIndex("timestamp", "timestamp", { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function localHashKey(question: string, persona: string, model: string): string {
  const normalized = normalizeQuestion(question);
  return `${persona}|${model}|${hashQuestion(normalized)}`;
}

export async function getCachedResponse(question: string, persona: string, model: string): Promise<string | null> {
  // Try client-side IndexedDB first
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const entry = await new Promise<CacheEntry | undefined>((resolve, reject) => {
      const req = store.get(localHashKey(question, persona, model));
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    if (entry) {
      if (Date.now() - entry.timestamp > TTL_MS) {
        db.close();
        await deleteEntry(entry.key);
      } else {
        db.close();
        return entry.response;
      }
    } else {
      db.close();
    }
  } catch {}

  // Try server-side cache
  try {
    const normalized = normalizeQuestion(question);
    const qHash = hashQuestion(normalized);
    const res = await fetch("/api/v1/ai/cache", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "lookup", questionHash: qHash, persona, model }),
    });
    const data = await res.json();
    if (data.hit && data.response) {
      // Prime local cache too
      setCachedResponse(question, persona, model, data.response, true);
      return data.response;
    }
  } catch {}

  return null;
}

export async function setCachedResponse(
  question: string, persona: string, model: string,
  response: string, skipServer?: boolean
): Promise<void> {
  // Always store locally
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);

    // Enforce max entries
    const count = await new Promise<number>((resolve, reject) => {
      const req = store.count();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    if (count >= MAX_ENTRIES) {
      const index = store.index("timestamp");
      const cursorReq = index.openCursor(null, "next");
      await new Promise<void>((resolve, reject) => {
        cursorReq.onsuccess = () => {
          const cursor = cursorReq.result;
          if (cursor) { store.delete(cursor.primaryKey); resolve(); }
          else resolve();
        };
        cursorReq.onerror = () => reject(cursorReq.error);
      });
    }

    const entry: CacheEntry = {
      key: localHashKey(question, persona, model),
      response,
      timestamp: Date.now(),
    };
    store.put(entry);
    tx.commit();
    db.close();
  } catch {}

  // Store server-side (fire-and-forget)
  if (!skipServer) {
    try {
      const normalized = normalizeQuestion(question);
      const qHash = hashQuestion(normalized);
      fetch("/api/v1/ai/cache", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "store", questionHash: qHash, persona, model, question: normalized, response }),
      }).catch(() => {});
    } catch {}
  }
}

async function deleteEntry(key: string): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete(key);
    tx.commit();
    db.close();
  } catch {}
}

// ─── Direct Replies (no API call) ──────────────────────────────────────────

const SHORT_REPLIES: Record<string, string> = {
  "hi": "Hello! 👋 How can I help you with your medical studies today?",
  "hello": "Hi there! 👋 Ready to dive into some medical knowledge?",
  "hey": "Hey! 👋 What medical topic can I help you with?",
  "thanks": "You're welcome! 😊 Happy studying!",
  "thank you": "You're welcome! 😊 Feel free to ask if you need anything else.",
  "thx": "Anytime! 🙌",
  "شكرا": "العفو! 😊 دايماً تحت أمرك.",
  "شكراً": "العفو! 😊 دايماً تحت أمرك.",
  "هلا": "هلا والله! 😊 كيف أقدر أساعدك في دراستك؟",
  "مرحبا": "مرحبا بك! 👋 كيف أقدر أساعدك اليوم؟",
  "ok": "👍",
  "okay": "👍",
  "good": "Great! 😊 Let me know if you need help with anything.",
  "great": "Awesome! 🎉 I'm here when you need me.",
  "nice": "Thanks! 😊 What would you like to study today?",
  "yes": "Sure! What medical topic would you like to explore?",
  "no": "Alright! Let me know if you need anything. 😊",
  "yep": "Go ahead! What can I help with?",
  "nope": "OK! I'm here if you need me. 😊",
  "ko": "تمام! 😊",
  "k": "👍",
};

export function getDirectReply(text: string): string | null {
  const cleaned = text.trim().toLowerCase().replace(/[.!?,]+$/, "");
  if (cleaned.length > 50) return null;
  return SHORT_REPLIES[cleaned] ?? null;
}
