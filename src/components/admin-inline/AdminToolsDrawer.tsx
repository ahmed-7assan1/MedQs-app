"use client";

import { ReactNode, useState } from "react";
import { Shield, X } from "lucide-react";

export function AdminToolsDrawer({ title = "Doctor tools", children }: { title?: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="mb-6 flex justify-end">
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2 text-sm font-semibold hover:bg-muted"
        >
          <Shield className="h-4 w-4 text-primary" />
          {title}
        </button>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-full max-w-xl border-l border-border bg-background shadow-xl">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <p className="text-sm font-semibold">{title}</p>
              <button
                onClick={() => setOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background hover:bg-muted"
                aria-label="Close doctor tools"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="h-[calc(100%-3.25rem)] overflow-auto px-4 py-4">{children}</div>
          </div>
        </div>
      ) : null}
    </>
  );
}

