import type {
  KeyResult,
  OkrCycle,
  ObjectiveProgressResult,
  ProgressThresholds,
  TrafficStatus,
} from "./types";

export const DEFAULT_PROGRESS_THRESHOLDS: ProgressThresholds = {
  atRiskDelta: 10,
  offTrackDelta: 20,
};

/**
 * Calculates Key-Result progress as percentage of the start→target range.
 * Supports reverse metrics (target < start) and boolean (0/1) milestones.
 */
export function calculateKeyResultProgress(kr: Pick<
  KeyResult,
  "startValue" | "targetValue" | "currentValue" | "metricType"
>): number {
  const { startValue, targetValue, currentValue, metricType } = kr;

  if (metricType === "boolean") {
    return currentValue >= 1 ? 100 : 0;
  }

  const span = targetValue - startValue;
  if (span === 0) {
    return currentValue === targetValue ? 100 : 0;
  }

  const raw = ((currentValue - startValue) / span) * 100;
  return clamp(raw, 0, 100);
}

/**
 * Weighted average of Key-Result progresses → Objective progress (0–100).
 */
export function calculateWeightedObjectiveProgress(
  keyResults: ReadonlyArray<Pick<KeyResult, "id" | "weight" | "startValue" | "targetValue" | "currentValue" | "metricType">>
): { progress: number; keyResults: { keyResultId: string; progress: number; weight: number }[] } {
  if (keyResults.length === 0) {
    return { progress: 0, keyResults: [] };
  }

  const rows = keyResults.map((kr) => {
    const weight = Number.isFinite(kr.weight) && kr.weight > 0 ? kr.weight : 1;
    const progress = calculateKeyResultProgress(kr);
    return { keyResultId: kr.id, progress, weight };
  });

  const totalWeight = rows.reduce((sum, row) => sum + row.weight, 0);
  const progress =
    totalWeight === 0
      ? 0
      : rows.reduce((sum, row) => sum + row.progress * row.weight, 0) / totalWeight;

  return { progress: round1(progress), keyResults: rows };
}

/**
 * Expected progress based on elapsed cycle time (0–100).
 * Before start → 0; after end → 100.
 */
export function calculateExpectedProgress(
  cycle: Pick<OkrCycle, "startDate" | "endDate">,
  asOf: Date = new Date()
): number {
  const start = startOfDay(parseDate(cycle.startDate));
  const end = endOfDay(parseDate(cycle.endDate));
  const now = asOf.getTime();

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
    return 0;
  }
  if (now <= start.getTime()) return 0;
  if (now >= end.getTime()) return 100;

  const elapsed = now - start.getTime();
  const total = end.getTime() - start.getTime();
  return round1(clamp((elapsed / total) * 100, 0, 100));
}

/**
 * Derives traffic-light status by comparing actual vs. expected progress.
 *
 * - On Track:  actual ≥ expected − atRiskDelta
 * - At Risk:   expected − offTrackDelta ≤ actual < expected − atRiskDelta
 * - Off Track: actual < expected − offTrackDelta
 */
export function deriveTrafficStatus(
  actualProgress: number,
  expectedProgress: number,
  thresholds: ProgressThresholds = DEFAULT_PROGRESS_THRESHOLDS
): TrafficStatus {
  const delta = expectedProgress - actualProgress;

  if (delta >= thresholds.offTrackDelta) return "off_track";
  if (delta >= thresholds.atRiskDelta) return "at_risk";
  return "on_track";
}

/**
 * Full Objective evaluation: weighted progress + cycle-aware status.
 */
export function calculateObjectiveProgress(params: {
  keyResults: ReadonlyArray<
    Pick<
      KeyResult,
      | "id"
      | "weight"
      | "startValue"
      | "targetValue"
      | "currentValue"
      | "metricType"
    >
  >;
  cycle: Pick<OkrCycle, "startDate" | "endDate">;
  asOf?: Date;
  thresholds?: ProgressThresholds;
}): ObjectiveProgressResult {
  const asOf = params.asOf ?? new Date();
  const { progress, keyResults } = calculateWeightedObjectiveProgress(params.keyResults);
  const expectedProgress = calculateExpectedProgress(params.cycle, asOf);
  const status = deriveTrafficStatus(
    progress,
    expectedProgress,
    params.thresholds ?? DEFAULT_PROGRESS_THRESHOLDS
  );

  return {
    progress,
    status,
    expectedProgress,
    delta: round1(expectedProgress - progress),
    keyResults,
    asOf: asOf.toISOString(),
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function parseDate(iso: string): Date {
  // Accept YYYY-MM-DD or full ISO
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y, m - 1, d);
  }
  return new Date(iso);
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
}

function endOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}
