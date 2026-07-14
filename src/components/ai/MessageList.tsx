"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { PROVIDER_CONFIGS } from "@/hooks/useDrQChat";
import { DRQ_PERSONAS, DrQPersonaId } from "./DrQPersonas";
import { DrQMessage } from "./DrQMessage";

export const MemoMessageList = React.memo(function MessageList({
  messages, embedded, isDark, activePersona, activeProvider,
  fontSize, userBubbleColor, aiBubbleColor,
  setReaction, regenerate, handleReply,
}: {
  messages: any[];
  embedded: boolean;
  isDark: boolean;
  activePersona: string;
  activeProvider: string;
  fontSize: number;
  userBubbleColor: string;
  aiBubbleColor: string;
  setReaction: any;
  regenerate: any;
  handleReply: any;
}) {
  return (
    <div className={cn("w-full space-y-4", embedded ? "px-3 py-4" : "px-4 sm:px-6 md:px-0 md:max-w-[48rem] md:mx-auto py-6 pb-8 space-y-6")}>
      {messages.map((m, idx) => (
        <motion.div
          key={m.id}
          data-message-id={m.id}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: idx < 5 ? idx * 0.03 : 0 }}
          className={cn("flex", m.role === "user" ? "justify-end md:max-w-none" : "justify-start")}
        >
          {m.role === "assistant" ? (
            <div className={cn("w-full", m.isStreaming && "stream-cursor")}>
              <div className="flex items-center gap-3 px-1 mb-2 mt-6">
                <div className={cn(
                  "w-8 h-8 md:w-7 md:h-7 rounded-xl flex items-center justify-center shadow-md",
                  `bg-gradient-to-br ${(DRQ_PERSONAS[activePersona as DrQPersonaId] || DRQ_PERSONAS.explainer).gradient}`
                )}>
                  {React.cloneElement(
                    (DRQ_PERSONAS[activePersona as DrQPersonaId] || DRQ_PERSONAS.explainer).icon as React.ReactElement,
                    { size: 16, weight: "fill", className: "text-white" }
                  )}
                </div>
                <div className="flex flex-col">
                  <span className={cn("text-sm md:text-[13px] font-bold", isDark ? "text-white" : "text-gray-900")}>
                    {(DRQ_PERSONAS[activePersona as DrQPersonaId] || DRQ_PERSONAS.explainer).name}
                  </span>
                  <span className={cn("text-[10px] font-semibold uppercase tracking-widest", isDark ? "text-gray-500" : "text-gray-400")}>
                    {PROVIDER_CONFIGS[activeProvider as keyof typeof PROVIDER_CONFIGS]?.label ?? "Provider"} · MedOneX Expert
                  </span>
                </div>
              </div>
              <DrQMessage
                message={m}
                fontSize={fontSize}
                userBubbleColor={userBubbleColor}
                aiBubbleColor={aiBubbleColor}
                onReaction={setReaction}
                onRegenerate={regenerate}
                onReply={handleReply}
                activePersona={activePersona}
                variant="flat"
              />
            </div>
          ) : (
            <DrQMessage
              message={m}
              fontSize={fontSize}
              userBubbleColor={userBubbleColor}
              aiBubbleColor={aiBubbleColor}
              onReaction={setReaction}
              onRegenerate={undefined}
              onReply={handleReply}
              activePersona={activePersona}
            />
          )}
        </motion.div>
      ))}
    </div>
  );
});
