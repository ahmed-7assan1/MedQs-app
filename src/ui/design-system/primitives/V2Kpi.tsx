import { V2Card } from "@/ui/design-system/primitives/V2Card";

export function V2Kpi({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <V2Card hover className="flex min-h-28 flex-col justify-between">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{value}</p>
      {hint ? <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{hint}</p> : null}
    </V2Card>
  );
}
