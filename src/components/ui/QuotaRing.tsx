"use client";

interface Props {
  used: number;
  limit: number;
  size?: number;
  strokeWidth?: number;
}

export function QuotaRing({ used, limit, size = 28, strokeWidth = 3 }: Props) {
  const pct = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;

  const color =
    pct < 50 ? "#22c55e" : pct < 80 ? "#f59e0b" : "#ef4444";
  const label =
    pct < 50 ? "Good" : pct < 80 ? "Moderate" : "Low";

  return (
    <div
      className="relative inline-flex items-center justify-center flex-shrink-0"
      style={{ width: size, height: size }}
      title={`${used}/${limit} daily — ${label}`}
    >
      <svg width={size} height={size} className="absolute inset-0">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="opacity-10"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
          style={{ filter: pct > 80 ? `drop-shadow(0 0 3px ${color})` : undefined }}
        />
      </svg>
      {limit > 0 && (
        <span
          className="text-[7px] font-bold leading-none select-none"
          style={{ color }}
        >
          {Math.round(pct)}%
        </span>
      )}
    </div>
  );
}
