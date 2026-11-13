import type { KeyResult, MetricType } from "./types";

export function formatMetricValue(
  value: number,
  metricType: MetricType,
  unit?: string
): string {
  switch (metricType) {
    case "boolean":
      return value >= 1 ? "Erreicht" : "Offen";
    case "percent":
      return `${formatNumber(value)} %`;
    case "currency": {
      const code = unit && unit.length === 3 ? unit : "EUR";
      try {
        return new Intl.NumberFormat("de-DE", {
          style: "currency",
          currency: code,
          maximumFractionDigits: 0,
        }).format(value);
      } catch {
        return `${formatNumber(value)} ${unit ?? "€"}`;
      }
    }
    case "number":
    default:
      return unit ? `${formatNumber(value)} ${unit}` : formatNumber(value);
  }
}

export function formatKeyResultRange(kr: Pick<
  KeyResult,
  "startValue" | "targetValue" | "currentValue" | "metricType" | "unit"
>): string {
  if (kr.metricType === "boolean") {
    return formatMetricValue(kr.currentValue, "boolean");
  }

  return `${formatMetricValue(kr.currentValue, kr.metricType, kr.unit)} / ${formatMetricValue(
    kr.targetValue,
    kr.metricType,
    kr.unit
  )}`;
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("de-DE", {
    maximumFractionDigits: 2,
  }).format(value);
}
