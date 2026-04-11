export const v2Tokens = {
  radius: {
    sm: "0.5rem",
    md: "0.85rem",
    lg: "1.15rem",
    xl: "1.4rem",
  },
  spacing: {
    xs: "0.25rem",
    sm: "0.5rem",
    md: "1rem",
    lg: "1.5rem",
    xl: "2rem",
  },
  motion: {
    fast: 120,
    normal: 180,
    slow: 280,
  },
  shadows: {
    card: "0 10px 28px rgba(15, 23, 42, 0.08)",
    float: "0 16px 40px rgba(15, 23, 42, 0.12)",
  },
} as const;

export type V2Tokens = typeof v2Tokens;
