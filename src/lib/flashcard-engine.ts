export interface SM2State {
  repetitions: number;
  easeFactor: number;
  interval: number;
}

export interface SM2Result extends SM2State {
  nextReviewAt: Date;
  quality: number;
}

export const QUALITY_MAP: Record<string, number> = {
  again: 0,
  hard: 2,
  good: 3,
  easy: 5,
};

export const RATING_LABELS = [
  { key: "again", label: "Again", color: "bg-red-500", short: "0" },
  { key: "hard", label: "Hard", color: "bg-orange-500", short: "2" },
  { key: "good", label: "Good", color: "bg-green-500", short: "3" },
  { key: "easy", label: "Easy", color: "bg-blue-500", short: "5" },
] as const;

export function parseQuality(label: string): number {
  return QUALITY_MAP[label] ?? 3;
}

export function calculateSM2(prev: SM2State, quality: number): SM2Result {
  const q = Math.max(0, Math.min(5, Math.round(quality)));

  let { repetitions, easeFactor, interval } = prev;

  if (q < 3) {
    repetitions = 0;
    interval = 1;
  } else {
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }
    repetitions += 1;
  }

  easeFactor = Math.max(
    1.3,
    easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  );

  const now = new Date();
  const minutes = q === 0 ? 1 : q === 1 ? 5 : 0;
  const nextReviewAt = new Date(
    now.getTime() +
      (minutes > 0 ? minutes * 60 * 1000 : interval * 24 * 60 * 60 * 1000)
  );

  return { repetitions, easeFactor, interval, nextReviewAt, quality: q };
}

export function createDefaultSM2State(): SM2State {
  return {
    repetitions: 0,
    easeFactor: 2.5,
    interval: 0,
  };
}

export function getDueFlashcards(progress: { nextReviewAt: Date | null }[]): number[] {
  const now = new Date();
  return progress
    .map((p, i) => ({ index: i, due: !p.nextReviewAt || p.nextReviewAt <= now }))
    .filter((p) => p.due)
    .map((p) => p.index);
}

export function countCardsByDifficulty(progress: { easeFactor: number }[]): {
  again: number;
  hard: number;
  good: number;
  easy: number;
} {
  const counts = { again: 0, hard: 0, good: 0, easy: 0 };
  for (const p of progress) {
    if (p.easeFactor < 1.8) counts.again++;
    else if (p.easeFactor < 2.2) counts.hard++;
    else if (p.easeFactor < 2.8) counts.good++;
    else counts.easy++;
  }
  return counts;
}
