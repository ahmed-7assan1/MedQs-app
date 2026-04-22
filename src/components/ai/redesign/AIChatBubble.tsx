"use client";

import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export function AIChatBubble({ message, isFirstInGroup = true }: { message: ChatMessage; isFirstInGroup?: boolean }) {
  const isAI = message.role === "assistant";

  return (
    <div className={cn("flex w-full", isAI ? "justify-start" : "justify-end")}>
      <div className={cn("flex items-start gap-2 max-w-[85%] md:max-w-[75%]", !isAI && "flex-row-reverse")}>
        {/* Avatar Circle for AI Mobile only shows dot "Q" */}
        {isAI && (
          <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-drq-primary text-[10px] font-bold text-white shadow-lg shadow-drq-primary/20">
            Q
          </div>
        )}

        <div className="flex flex-col gap-1">
          <div
            className={cn(
              "px-4 py-3 text-[13px] leading-relaxed shadow-sm",
              isAI
                ? "bg-drq-surface border border-drq-border text-white rounded-2xl rounded-tl-[4px]"
                : "bg-drq-primary text-white rounded-2xl rounded-tr-[4px]"
            )}
            style={{ textAlign: "left", direction: "ltr" }} // Strict requirement
          >
            {isAI ? (
              <ReactMarkdown
                className="prose-drq"
                components={{
                  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                  strong: ({ children }) => <strong className="font-bold text-drq-purple-light">{children}</strong>,
                  h1: ({ children }) => <h1 className="text-[11px] font-bold uppercase tracking-wider text-drq-purple-light mb-2">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-[11px] font-bold uppercase tracking-wider text-drq-purple-light mb-2">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-[11px] font-bold uppercase tracking-wider text-drq-purple-light mb-2">{children}</h3>,
                  ul: ({ children }) => <ul className="my-2 space-y-1.5">{children}</ul>,
                  li: ({ children }) => (
                    <li className="flex items-start gap-2">
                       <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-drq-purple-light" />
                       <span>{children}</span>
                    </li>
                  ),
                }}
              >
                {message.content}
              </ReactMarkdown>
            ) : (
              <p className="whitespace-pre-wrap">{message.content}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
