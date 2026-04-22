"use client";

import { useAIChat } from "@/hooks/useAIChat";
import { AIChatBubble } from "@/components/ai/redesign/AIChatBubble";
import { AIChatInput } from "@/components/ai/redesign/AIChatInput";
import { LeftSidebar, RightSidebar } from "@/components/ai/redesign/AIChatSidebars";
import { AIChatMobileHeader } from "@/components/ai/redesign/AIChatMobileHeader";
import { SuggestionPills } from "@/components/ai/redesign/SuggestionPills";
import { useEffect, useRef } from "react";

interface AIChatClientProps {
  user: {
    name: string;
    rank: string;
  };
}

export function AIChatClient({ user }: AIChatClientProps) {
  const { messages, loading, threads, activeThreadId, sendMessage, selectThread, newTopic } = useAIChat();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  return (
    <div className="drq-redesign-root flex h-screen w-full flex-col bg-drq-bg font-sans overflow-hidden">
      {/* 1. Mobile Header (Fixed/Sticky) */}
      <div className="lg:hidden">
        <AIChatMobileHeader onNewTopic={newTopic} onBack={() => window.history.back()} />
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* 2. Desktop Left Sidebar (Fixed width) */}
        <LeftSidebar 
          threads={threads} 
          activeId={activeThreadId} 
          onSelect={selectThread} 
          onNew={newTopic}
          user={user} 
        />

        {/* 3. Main Chat Column (Flex: 1, Centered Content) */}
        <main className="flex-1 flex flex-col min-w-0 lg:ml-[240px] xl:mr-[280px] relative">
          
          {/* Scrollable Chat Area */}
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-4 py-6 space-y-6 scrollbar-thin scrollbar-thumb-drq-border scrollbar-track-transparent"
          >
            {/* Initial Suggestions (if no messages) */}
            {messages.length === 0 && (
              <div className="mt-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <SuggestionPills onSelect={sendMessage} />
              </div>
            )}

            {/* Message Thread */}
            <div className="max-w-[680px] mx-auto w-full space-y-6 pb-20">
              {messages.map((m, idx) => (
                <AIChatBubble key={idx} message={m} />
              ))}
              
              {loading && (
                <div className="flex justify-start items-center gap-2 text-drq-purple-light animate-pulse">
                  <div className="h-2 w-2 rounded-full bg-drq-primary" />
                  <div className="h-2 w-2 rounded-full bg-drq-primary delay-75" />
                  <div className="h-2 w-2 rounded-full bg-drq-primary delay-150" />
                </div>
              )}
            </div>
          </div>

          {/* Fixed Input Bar */}
          <div className="sticky bottom-0 w-full">
            <AIChatInput onSend={sendMessage} disabled={loading} />
          </div>
        </main>

        {/* 4. Desktop Right Sidebar (Fixed width) */}
        <RightSidebar sessionContext={{
           subject: "CNS / PHYSIO",
           lastLecture: "Synaptic Transmission",
           mastery: 68,
           questionsToday: 12
        }} />
      </div>
    </div>
  );
}
