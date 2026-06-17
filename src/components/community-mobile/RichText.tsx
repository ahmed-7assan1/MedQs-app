// src/components/community-mobile/RichText.tsx
"use client";

import { parseRichText } from "./utils";

interface RichTextProps {
  content: string;
  className?: string;
  onHashtagClick?: (tag: string) => void;
}

export default function RichText({ content, className, onHashtagClick }: RichTextProps) {
  const segments = parseRichText(content);

  return (
    <p className={`text-sm leading-relaxed text-foreground whitespace-pre-wrap break-words ${className ?? ""}`}>
      {segments.map((segment, index) => {
        switch (segment.type) {
          case "bold":
            return (
              <strong key={index} className="font-semibold">
                {segment.value}
              </strong>
            );
          case "italic":
            return (
              <em key={index} className="italic">
                {segment.value}
              </em>
            );
          case "code":
            return (
              <code
                key={index}
                className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[13px]"
              >
                {segment.value}
              </code>
            );
          case "hashtag":
            return (
              <button
                key={index}
                type="button"
                onClick={() => onHashtagClick?.(segment.value.slice(1))}
                className="text-primary hover:underline"
              >
                {segment.value}
              </button>
            );
          default:
            return <span key={index}>{segment.value}</span>;
        }
      })}
    </p>
  );
}
