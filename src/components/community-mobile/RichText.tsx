"use client";

import React, { useState } from "react";

interface RichTextProps {
  text: string;
  collapsed?: boolean;
  onExpand?: () => void;
}

const LIMIT = 200;

function parseBold(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /\*\*(.+?)\*\*/g;
  let last = 0;
  let idx = 0;

  text.split("\n").forEach((line, li) => {
    if (li > 0) parts.push(<br key={`br-${li}`} />);
    let match: RegExpExecArray | null;
    let lineLast = 0;
    while ((match = regex.exec(line)) !== null) {
      if (match.index > lineLast) {
        parts.push(<span key={`t-${idx++}`}>{line.slice(lineLast, match.index)}</span>);
      }
      parts.push(
        <strong key={`b-${idx++}`} className="font-semibold">
          {match[1]}
        </strong>
      );
      lineLast = match.index + match[0].length;
    }
    if (lineLast < line.length) {
      parts.push(<span key={`t-${idx++}`}>{line.slice(lineLast)}</span>);
    }
  });

  return parts;
}

export function RichText({ text, collapsed, onExpand }: RichTextProps) {
  const [localExpanded, setLocalExpanded] = useState(false);
  const isCollapsed = collapsed && !localExpanded && text.length > LIMIT;
  const display = isCollapsed ? text.slice(0, LIMIT) : text;

  return (
    <p className="text-sm leading-relaxed" style={{ color: "var(--text-primary)" }}>
      {parseBold(display)}
      {isCollapsed && (
        <>
          ...{" "}
          <button
            onClick={() => {
              setLocalExpanded(true);
              onExpand?.();
            }}
            className="font-semibold text-xs"
            style={{ color: "var(--brand)" }}
          >
            more
          </button>
        </>
      )}
    </p>
  );
}
