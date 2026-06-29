import { describe, it, expect } from "vitest";
import {
  calculateSM2,
  createDefaultSM2State,
  parseQuality,
  QUALITY_MAP,
} from "@/lib/flashcard-engine";

describe("parseQuality", () => {
  it("returns 0 for 'again'", () => {
    expect(parseQuality("again")).toBe(0);
  });

  it("returns 2 for 'hard'", () => {
    expect(parseQuality("hard")).toBe(2);
  });

  it("returns 3 for 'good'", () => {
    expect(parseQuality("good")).toBe(3);
  });

  it("returns 5 for 'easy'", () => {
    expect(parseQuality("easy")).toBe(5);
  });

  it("returns default 3 for unknown label", () => {
    expect(parseQuality("invalid")).toBe(3);
  });

  it("maps all QUALITY_MAP entries correctly", () => {
    for (const [label, expected] of Object.entries(QUALITY_MAP)) {
      expect(parseQuality(label)).toBe(expected);
    }
  });
});

describe("createDefaultSM2State", () => {
  it("returns default SM2 state", () => {
    const state = createDefaultSM2State();
    expect(state.repetitions).toBe(0);
    expect(state.easeFactor).toBe(2.5);
    expect(state.interval).toBe(0);
  });
});

describe("calculateSM2", () => {
  const defaultState = createDefaultSM2State();

  it("resets on quality < 3 (first review, 'again')", () => {
    const result = calculateSM2(defaultState, 0);
    expect(result.repetitions).toBe(0);
    expect(result.interval).toBe(1);
    expect(result.quality).toBe(0);
    expect(result.nextReviewAt.getTime()).toBeGreaterThan(Date.now());
  });

  it("schedules 1 day on first 'good'", () => {
    const result = calculateSM2(defaultState, 3);
    expect(result.repetitions).toBe(1);
    expect(result.interval).toBe(1);
    expect(result.quality).toBe(3);
  });

  it("schedules 6 days on second 'good'", () => {
    const state = { repetitions: 1, easeFactor: 2.5, interval: 1 };
    const result = calculateSM2(state, 3);
    expect(result.repetitions).toBe(2);
    expect(result.interval).toBe(6);
  });

  it("increases interval by ease factor on subsequent reviews", () => {
    const state = { repetitions: 2, easeFactor: 2.5, interval: 6 };
    const result = calculateSM2(state, 4);
    expect(result.repetitions).toBe(3);
    expect(result.interval).toBe(15); // 6 * 2.5
  });

  it("clamps ease factor to minimum 1.3", () => {
    const state = { repetitions: 2, easeFactor: 1.3, interval: 6 };
    const result = calculateSM2(state, 0);
    expect(result.easeFactor).toBeGreaterThanOrEqual(1.3);
  });

  it("returns nextReviewAt in the future", () => {
    const result = calculateSM2(defaultState, 5);
    expect(result.nextReviewAt.getTime()).toBeGreaterThan(Date.now());
  });

  it("handles quality 1 (5-minute review)", () => {
    const result = calculateSM2({ repetitions: 0, easeFactor: 2.5, interval: 0 }, 1);
    expect(result.interval).toBe(1);
    // quality 1 → 5 minutes
    const expectedMs = Date.now() + 5 * 60 * 1000;
    const diff = Math.abs(result.nextReviewAt.getTime() - expectedMs);
    expect(diff).toBeLessThan(100); // within 100ms
  });
});
