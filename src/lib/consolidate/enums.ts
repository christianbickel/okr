import type {
  CycleStatus,
  CycleType,
  MetricType,
  ObjectiveLevel,
  ObjectiveLifecycleStatus,
  TrafficStatus,
} from "@/lib/okr/types";

/** Consolidate ComboBox options are stored as Int ids. */

export const CYCLE_TYPE_OPTIONS = [
  { id: 0, value: "quarter" as const, label: "Quartal" },
  { id: 1, value: "year" as const, label: "Jahr" },
  { id: 2, value: "custom" as const, label: "Benutzerdefiniert" },
] as const;

export const CYCLE_STATUS_OPTIONS = [
  { id: 0, value: "draft" as const, label: "Entwurf" },
  { id: 1, value: "active" as const, label: "Aktiv" },
  { id: 2, value: "closed" as const, label: "Geschlossen" },
] as const;

export const OBJECTIVE_LEVEL_OPTIONS = [
  { id: 0, value: "company" as const, label: "Unternehmen" },
  { id: 1, value: "team" as const, label: "Team" },
  { id: 2, value: "individual" as const, label: "Individuell" },
] as const;

export const OBJECTIVE_STATUS_OPTIONS = [
  { id: 0, value: "draft" as const, label: "Entwurf" },
  { id: 1, value: "on_track" as const, label: "On Track" },
  { id: 2, value: "at_risk" as const, label: "At Risk" },
  { id: 3, value: "off_track" as const, label: "Off Track" },
  { id: 4, value: "completed" as const, label: "Abgeschlossen" },
] as const;

export const TRAFFIC_STATUS_OPTIONS = [
  { id: 0, value: "on_track" as const, label: "On Track" },
  { id: 1, value: "at_risk" as const, label: "At Risk" },
  { id: 2, value: "off_track" as const, label: "Off Track" },
] as const;

export const METRIC_TYPE_OPTIONS = [
  { id: 0, value: "percent" as const, label: "Prozent" },
  { id: 1, value: "currency" as const, label: "Währung" },
  { id: 2, value: "number" as const, label: "Zahl" },
  { id: 3, value: "boolean" as const, label: "Ja/Nein" },
] as const;

function toId<T extends string>(
  options: ReadonlyArray<{ id: number; value: T }>,
  value: T
): number {
  const hit = options.find((o) => o.value === value);
  if (!hit) throw new Error(`Unknown combo value: ${value}`);
  return hit.id;
}

function fromCombo<T extends string>(
  options: ReadonlyArray<{ id: number; value: T }>,
  combo: { id: number; value?: string | null } | null | undefined,
  fallback: T
): T {
  if (!combo) return fallback;
  const byId = options.find((o) => o.id === combo.id);
  if (byId) return byId.value;
  const byValue = options.find((o) => o.value === combo.value);
  return byValue?.value ?? fallback;
}

export const cycleTypeId = (v: CycleType) => toId(CYCLE_TYPE_OPTIONS, v);
export const cycleStatusId = (v: CycleStatus) => toId(CYCLE_STATUS_OPTIONS, v);
export const objectiveLevelId = (v: ObjectiveLevel) =>
  toId(OBJECTIVE_LEVEL_OPTIONS, v);
export const objectiveStatusId = (v: ObjectiveLifecycleStatus) =>
  toId(OBJECTIVE_STATUS_OPTIONS, v);
export const trafficStatusId = (v: TrafficStatus) =>
  toId(TRAFFIC_STATUS_OPTIONS, v);
export const metricTypeId = (v: MetricType) => toId(METRIC_TYPE_OPTIONS, v);

export const parseCycleType = (c?: { id: number; value?: string | null } | null) =>
  fromCombo(CYCLE_TYPE_OPTIONS, c, "quarter");
export const parseCycleStatus = (c?: { id: number; value?: string | null } | null) =>
  fromCombo(CYCLE_STATUS_OPTIONS, c, "draft");
export const parseObjectiveLevel = (c?: { id: number; value?: string | null } | null) =>
  fromCombo(OBJECTIVE_LEVEL_OPTIONS, c, "company");
export const parseObjectiveStatus = (c?: {
  id: number;
  value?: string | null;
} | null) => fromCombo(OBJECTIVE_STATUS_OPTIONS, c, "draft");
export const parseTrafficStatus = (c?: { id: number; value?: string | null } | null) =>
  fromCombo(TRAFFIC_STATUS_OPTIONS, c, "on_track");
export const parseMetricType = (c?: { id: number; value?: string | null } | null) =>
  fromCombo(METRIC_TYPE_OPTIONS, c, "number");
