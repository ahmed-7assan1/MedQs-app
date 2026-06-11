"use client";

interface FilterPillsProps {
  filters: { key: string; label: string; icon?: string }[];
  active: string;
  onChange: (key: string) => void;
}

export function FilterPills({ filters, active, onChange }: FilterPillsProps) {
  return (
    <div
      className="flex items-center gap-2 overflow-x-auto px-4 pb-1"
      style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
    >
      {filters.map((f) => (
        <button
          key={f.key}
          onClick={() => onChange(f.key)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all flex-shrink-0"
          style={{
            background: active === f.key ? "var(--brand)" : "var(--bg-secondary)",
            color: active === f.key ? "#fff" : "var(--text-secondary)",
            border: active === f.key ? "none" : "1px solid var(--border-glass)",
          }}
        >
          {f.icon && <span>{f.icon}</span>}
          {f.label}
        </button>
      ))}
    </div>
  );
}
