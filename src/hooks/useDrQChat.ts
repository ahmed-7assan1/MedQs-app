import { useState, useCallback, useEffect } from "react";
import { toast } from "react-hot-toast";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  files?: Array<{ data: string; mimeType: string; name: string }>;
};

export type BYOKSettings = {
  useCustomKey: boolean;
  customProvider: "gemini" | "openai" | "groq" | "xai";
  customKey: string;
  customModel?: string;
  theme: "system" | "light" | "dark";
  fontSize: number;
  userBubbleColor: string;
  aiBubbleColor: string;
};

const BYOK_STORAGE_KEY = "medqs-dr-q-byok-settings";
const THREADS_KEY = "medqs-dr-q-threads-v3";

export function useDrQChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<BYOKSettings>({
    useCustomKey: false,
    customProvider: "gemini",
    customKey: "",
    theme: "system",
    fontSize: 15,
    userBubbleColor: "#3b82f6",
    aiBubbleColor: "#1e1d24"
  });
  const [limits, setLimits] = useState<{
    used: number; limit: number; filesUsed: number; fileLimit: number; rankLabel: string;
  }>({ used: 0, limit: 100, filesUsed: 0, fileLimit: 3, rankLabel: "Newbie" });

  useEffect(() => {
    try {
      const storedSettings = localStorage.getItem(BYOK_STORAGE_KEY);
      if (storedSettings) setSettings(JSON.parse(storedSettings));
      
      const storedThreads = localStorage.getItem(THREADS_KEY);
      if (storedThreads) {
        const parsed = JSON.parse(storedThreads);
        if (parsed.length > 0) setMessages(parsed[0].messages);
      }
    } catch {}
    fetchLimits();
  }, []);

  const fetchLimits = async () => {
    try {
      const res = await fetch("/api/v1/ai/chat");
      if (res.ok) {
        const data = await res.json();
        setLimits({
          used: data.used,
          limit: data.limit,
          filesUsed: data.filesUsed,
          fileLimit: data.fileLimit,
          rankLabel: data.rankLabel
        });
      }
    } catch {}
  };

  const updateSettings = (newSettings: BYOKSettings) => {
    setSettings(newSettings);
    localStorage.setItem(BYOK_STORAGE_KEY, JSON.stringify(newSettings));
    toast.success("Settings saved successfully.");
  };

  const clearChat = () => {
    setMessages([]);
    localStorage.removeItem(THREADS_KEY);
  };

  const sendMessage = useCallback(
    async (content: string, files: Array<{ data: string; mimeType: string; name: string }> = []) => {
      if (!content.trim() && files.length === 0) return;
      if (loading) return;

      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        role: "user",
        content,
        files: files.length > 0 ? files : undefined,
      };

      const nextMessages = [...messages, userMessage];
      setMessages(nextMessages);
      setLoading(true);

      // Create empty AI message for streaming
      const aiMessageId = (Date.now() + 1).toString();
      const initialAiMessage: ChatMessage = {
        id: aiMessageId,
        role: "assistant",
        content: "",
      };
      setMessages([...nextMessages, initialAiMessage]);

      try {
        const history = nextMessages.slice(0, -1).map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const images = files.filter(f => f.mimeType.startsWith("image/"));
        const pdfs = files.filter(f => f.mimeType === "application/pdf");

        const res = await fetch("/api/v1/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: content,
            conversationHistory: history,
            images,
            pdfs,
            useCustomKey: settings.useCustomKey,
            customKey: settings.customKey,
            customProvider: settings.customProvider,
            customModel: settings.customModel,
            stream: true,
          }),
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.error || "Failed to get AI reply");
        }

        const reader = res.body?.getReader();
        const decoder = new TextDecoder();
        let accumulatedReply = "";

        if (!reader) throw new Error("No response body");

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value, { stream: true });
          accumulatedReply += chunk;
          
          // Update the message in real-time
          setMessages(prev => 
            prev.map(m => m.id === aiMessageId ? { ...m, content: accumulatedReply } : m)
          );
        }

        // Final save to local storage
        const finalMessages = [...nextMessages, { ...initialAiMessage, content: accumulatedReply }];
        localStorage.setItem(THREADS_KEY, JSON.stringify([{ id: "default", messages: finalMessages }]));

        // Refresh limits after completion
        fetchLimits();

      } catch (err: any) {
        toast.error(`Dr. Q Error: ${err.message}`);
        // Remove the empty AI message and revert user message if it failed immediately
        setMessages(messages);
      } finally {
        setLoading(false);
      }
    },
    [messages, loading, settings]
  );

  return {
    messages,
    loading,
    sendMessage,
    settings,
    updateSettings,
    limits,
    clearChat
  };
}
