import { describe, expect, it } from "vitest";
import {
  calculateExpectedProgress,
  calculateKeyResultProgress,
  calculateObjectiveProgress,
  deriveTrafficStatus,
} from "./progress";

describe("calculateKeyResultProgress", () => {
  it("handles linear metrics", () => {
    expect(
      calculateKeyResultProgress({
        startValue: 0,
        targetValue: 100,
        currentValue: 40,
        metricType: "percent",
      })
    ).toBe(40);
  });

  it("handles reverse metrics (lower is better)", () => {
    expect(
      calculateKeyResultProgress({
        startValue: 10,
        targetValue: 4,
        currentValue: 7,
        metricType: "number",
      })
    ).toBe(50);
  });

  it("handles boolean milestones", () => {
    expect(
      calculateKeyResultProgress({
        startValue: 0,
        targetValue: 1,
        currentValue: 0,
        metricType: "boolean",
      })
    ).toBe(0);
    expect(
      calculateKeyResultProgress({
        startValue: 0,
        targetValue: 1,
        currentValue: 1,
        metricType: "boolean",
      })
    ).toBe(100);
  });
});

describe("calculateObjectiveProgress", () => {
  it("weights key results and derives cycle-aware status", () => {
    const result = calculateObjectiveProgress({
      cycle: { startDate: "2026-01-01", endDate: "2026-03-31" },
      asOf: new Date("2026-02-15T12:00:00"),
      keyResults: [
        {
          id: "a",
          weight: 1,
          startValue: 0,
          targetValue: 100,
          currentValue: 50,
          metricType: "percent",
        },
        {
          id: "b",
          weight: 3,
          startValue: 0,
          targetValue: 100,
          currentValue: 20,
          metricType: "percent",
        },
      ],
    });

    // (50*1 + 20*3) / 4 = 27.5
    expect(result.progress).toBe(27.5);
    expect(result.expectedProgress).toBeGreaterThan(40);
    expect(result.status).toBe("off_track");
  });
});

describe("deriveTrafficStatus", () => {
  it("maps deltas to traffic lights", () => {
    expect(deriveTrafficStatus(50, 50)).toBe("on_track");
    expect(deriveTrafficStatus(40, 50)).toBe("at_risk");
    expect(deriveTrafficStatus(25, 50)).toBe("off_track");
  });
});

describe("calculateExpectedProgress", () => {
  it("clamps outside the cycle window", () => {
    const cycle = { startDate: "2026-01-01", endDate: "2026-03-31" };
    expect(calculateExpectedProgress(cycle, new Date("2025-12-01"))).toBe(0);
    expect(calculateExpectedProgress(cycle, new Date("2026-04-01"))).toBe(100);
  });
});
