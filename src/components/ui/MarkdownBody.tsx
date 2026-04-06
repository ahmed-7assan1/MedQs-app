"use client";

import { cn } from "@/lib/utils";
import { enhancePlainImageUrls } from "@/lib/markdown-helpers";
import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import { markdownComponentsWithImages } from "@/components/ui/markdown-components";

const inlineComponents: Components = {
  ...markdownComponentsWithImages,
  p: ({ children }) => <span className="block leading-snug">{children}</span>,
  ul: ({ children }) => <span className="my-1 block pl-3">{children}</span>,
  ol: ({ children }) => <span className="my-1 block list-decimal pl-4">{children}</span>,
  li: ({ children }) => <span className="block before:mr-1.5 before:inline before:content-['•']">{children}</span>,
};

type Props = {
  /** Question/choice text from DB may be null or non-string at runtime */
  content: string | null | undefined;
  className?: string;
  /** Use inside buttons or tight rows — avoids extra paragraph margins */
  inline?: boolean;
  /** `span` for valid HTML inside `<button>` (choices) */
  as?: "div" | "span";
};

function toMarkdownSource(raw: string | null | undefined): string {
  if (typeof raw === "string") return raw;
  if (raw == null) return "";
  try {
    return String(raw);
  } catch {
    return "";
  }
}

export function MarkdownBody({ content, className, inline = false, as = "div" }: Props) {
  const Tag = as;
  const raw = toMarkdownSource(content);
  const src = enhancePlainImageUrls(raw);
  return (
    <Tag
      className={cn(
        "prose prose-sm max-w-none dark:prose-invert prose-headings:font-semibold prose-p:leading-relaxed prose-img:my-3",
        inline && "prose-p:my-0 prose-headings:my-0 prose-ul:my-1 prose-ol:my-1",
        className
      )}
    >
      <ReactMarkdown components={inline ? inlineComponents : markdownComponentsWithImages}>{src}</ReactMarkdown>
    </Tag>
  );
}

export { markdownComponentsWithImages };
