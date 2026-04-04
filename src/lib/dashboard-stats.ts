/** Local calendar date YYYY-MM-DD */
export function localYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function startOfLocalDay(d = new Date()): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/** Days with at least one quiz attempt (local dates). */
export function computeStreak(activeDays: Set<string>): number {
  const today = startOfLocalDay();
  let check = new Date(today);
  if (!activeDays.has(localYmd(check))) {
    check.setDate(check.getDate() - 1);
    if (!activeDays.has(localYmd(check))) return 0;
  }
  let streak = 0;
  while (activeDays.has(localYmd(check))) {
    streak++;
    check.setDate(check.getDate() - 1);
  }
  return streak;
}

/** Last 7 days from today, oldest first — for chart labels + bucket keys */
export function last7DayKeys(): { key: string; shortLabel: string }[] {
  const out: { key: string; shortLabel: string }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(12, 0, 0, 0);
    out.push({
      key: localYmd(d),
      shortLabel: d.toLocaleDateString(undefined, { weekday: "short" }),
    });
  }
  return out;
}

export function bucketItemsByLocalDay(
  attemptCreatedAts: Date[],
  dayKeys: string[]
): number[] {
  const counts = Object.fromEntries(dayKeys.map((k) => [k, 0])) as Record<string, number>;
  for (const at of attemptCreatedAts) {
    const k = localYmd(at);
    if (k in counts) counts[k]++;
  }
  return dayKeys.map((k) => counts[k] ?? 0);
}
