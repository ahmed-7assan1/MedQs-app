"use client";

import { useState, useCallback, useEffect } from "react";
import toast from "react-hot-toast";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface Thread {
  id: string;
  title: string;
  updatedAt: number;
  messages: ChatMessage[];
}

const THREADS_KEY = "medqs-dr-q-threads-v1";

export function useAIChat() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);

  // Load threads
  useEffect(() => {
    const raw = localStorage.getItem(THREADS_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setThreads(parsed);
        if (parsed.length > 0) {
          setActiveThreadId(parsed[0].id);
          setMessages(parsed[0].messages);
        }
      } catch (e) {
        console.error("Failed to load threads", e);
      }
    }
  }, []);

  // Save threads
  useEffect(() => {
    if (threads.length > 0) {
      localStorage.setItem(THREADS_KEY, JSON.stringify(threads));
    }
  }, [threads]);

  const selectThread = useCallback((id: string) => {
    setActiveThreadId(id);
    const t = threads.find((x) => x.id === id);
    setMessages(t?.messages ?? []);
  }, [threads]);

  const newTopic = useCallback(() => {
    const id = `t-${Date.now()}`;
    const nt: Thread = { id, title: "New topic", updatedAt: Date.now(), messages: [] };
    setThreads((prev) => [nt, ...prev]);
    setActiveThreadId(id);
    setMessages([]);
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || loading) return;

    const userMessage: ChatMessage = { role: "user", content };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setLoading(true);

    try {
      const res = await fetch("/api/v1/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: content, conversationHistory: messages }),
      });
      const data = await res.json();
      
      if (res.ok) {
        const aiMessage: ChatMessage = { role: "assistant", content: data.reply };
        const finalMessages = [...nextMessages, aiMessage];
        setMessages(finalMessages);

        // Update thread title if first message
        setThreads((prev) => 
          prev.map((t) => 
            t.id === activeThreadId 
              ? { 
                  ...t, 
                  messages: finalMessages, 
                  updatedAt: Date.now(),
                  title: t.title === "New topic" ? content.slice(0, 40) : t.title 
                } 
              : t
          )
        );
      } else {
        toast.error(data.error || "Failed to get response");
      }
    } catch (e) {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  }, [messages, loading, activeThreadId]);

  return {
    threads,
    activeThreadId,
    messages,
    loading,
    sendMessage,
    selectThread,
    newTopic
  };
}
