"use client";

import { cn } from "@/lib/utils";
import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";

const baseComponents: Components = {
  strong: ({ children }) => <strong className="font-semibold text-primary">{children}</strong>,
  a: ({ href, children }) => (
    <a
      href={href}
      className="font-medium text-primary underline-offset-2 hover:underline"
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  ),
  code: ({ children }) => (
    <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.9em] before:content-none after:content-none">
      {children}
    </code>
  ),
};

const inlineComponents: Components = {
  ...baseComponents,
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
  const src = toMarkdownSource(content);
  return (
    <Tag
      className={cn(
        "prose prose-sm max-w-none dark:prose-invert prose-headings:font-semibold prose-p:leading-relaxed",
        inline && "prose-p:my-0 prose-headings:my-0 prose-ul:my-1 prose-ol:my-1",
        className
      )}
    >
      <ReactMarkdown components={inline ? inlineComponents : baseComponents}>{src}</ReactMarkdown>
    </Tag>
  );
}
