export const CONFETTI_COLORS = ["#f43f5e", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#a855f7"];
export const CONFETTI_SHAPES = ["square", "circle", "triangle"] as const;

export interface ConfettiPiece {
  id: number;
  x: number;
  color: string;
  shape: string;
  size: number;
  delay: number;
}

export function createConfettiPieces(count: number): ConfettiPiece[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    shape: CONFETTI_SHAPES[Math.floor(Math.random() * CONFETTI_SHAPES.length)],
    size: 6 + Math.random() * 8,
    delay: Math.random() * 0.5,
  }));
}

export const STREAK_MILESTONES = [3, 7, 14, 21, 30, 60, 90, 180, 365];
