import type {
  CheckInInput,
  KeyResult,
  Objective,
  OkrCycle,
  OkrUserRef,
} from "@/lib/okr/types";
import {
  parseCycleStatus,
  parseCycleType,
  parseMetricType,
  parseObjectiveLevel,
  parseObjectiveStatus,
  parseTrafficStatus,
} from "./enums";

type Combo = { id: number; value?: string | null } | null | undefined;

export interface CycleRecord extends OkrCycle {
  changeVector?: string;
  descriptionHtml?: string;
}

export interface ObjectiveRecord extends Omit<Objective, "keyResults"> {
  changeVector?: string;
  descriptionHtml?: string;
  keyResults?: KeyResult[];
}

export interface KeyResultRecord extends KeyResult {
  changeVector?: string;
  descriptionHtml?: string;
}

export interface CheckInRecord {
  id: string;
  title: string;
  keyResultId: string;
  author: OkrUserRef;
  value: number;
  status: CheckInInput["status"];
  checkInDate: string;
  comment?: string;
  changeVector?: string;
}

function mapUser(
  owner:
    | {
        __typename?: string;
        id?: string;
        displayName?: string;
        name?: string;
        email?: string;
      }
    | null
    | undefined
): OkrUserRef {
  if (!owner?.id) {
    return { id: "", displayName: "Unbekannt" };
  }
  return {
    id: owner.id,
    displayName: owner.displayName || owner.name || "Unbekannt",
    email: owner.email,
  };
}

function num(value: unknown, fallback = 0): number {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim() !== "") return Number(value);
  return fallback;
}

export function mapCycle(entry: {
  id: string;
  changeVector?: string | null;
  values: {
    title?: string | null;
    description?: { htmlText?: string | null } | null;
    startDate?: string | null;
    endDate?: string | null;
    cycleType?: Combo;
    status?: Combo;
  };
}): CycleRecord {
  return {
    id: entry.id,
    changeVector: entry.changeVector ?? undefined,
    title: entry.values.title ?? "",
    descriptionHtml: entry.values.description?.htmlText ?? undefined,
    description: stripHtml(entry.values.description?.htmlText),
    startDate: entry.values.startDate ?? "",
    endDate: entry.values.endDate ?? "",
    cycleType: parseCycleType(entry.values.cycleType),
    status: parseCycleStatus(entry.values.status),
  };
}

export function mapObjective(entry: {
  id: string;
  changeVector?: string | null;
  values: {
    title?: string | null;
    description?: { htmlText?: string | null } | null;
    level?: Combo;
    cycleId?: string | null;
    status?: Combo;
    parentObjectiveId?: string | null;
    owner?: Parameters<typeof mapUser>[0];
    teamId?: string | null;
    teamName?: string | null;
    progress?: unknown;
    weight?: unknown;
  };
}): ObjectiveRecord {
  return {
    id: entry.id,
    changeVector: entry.changeVector ?? undefined,
    title: entry.values.title ?? "",
    descriptionHtml: entry.values.description?.htmlText ?? undefined,
    description: stripHtml(entry.values.description?.htmlText),
    level: parseObjectiveLevel(entry.values.level),
    cycleId: entry.values.cycleId ?? "",
    parentObjectiveId: entry.values.parentObjectiveId ?? undefined,
    owner: mapUser(entry.values.owner),
    teamId: entry.values.teamId ?? undefined,
    teamName: entry.values.teamName ?? undefined,
    status: parseObjectiveStatus(entry.values.status),
    progress: num(entry.values.progress),
    weight: entry.values.weight == null ? undefined : num(entry.values.weight, 1),
    keyResults: [],
  };
}

export function mapKeyResult(entry: {
  id: string;
  changeVector?: string | null;
  values: {
    title?: string | null;
    description?: { htmlText?: string | null } | null;
    objectiveId?: string | null;
    owner?: Parameters<typeof mapUser>[0];
    metricType?: Combo;
    unit?: string | null;
    status?: Combo;
    startValue?: unknown;
    targetValue?: unknown;
    currentValue?: unknown;
    weight?: unknown;
    dueDate?: string | null;
  };
}): KeyResultRecord {
  return {
    id: entry.id,
    changeVector: entry.changeVector ?? undefined,
    title: entry.values.title ?? "",
    descriptionHtml: entry.values.description?.htmlText ?? undefined,
    description: stripHtml(entry.values.description?.htmlText),
    objectiveId: entry.values.objectiveId ?? "",
    owner: mapUser(entry.values.owner),
    metricType: parseMetricType(entry.values.metricType),
    unit: entry.values.unit ?? undefined,
    status: parseTrafficStatus(entry.values.status),
    startValue: num(entry.values.startValue),
    targetValue: num(entry.values.targetValue),
    currentValue: num(entry.values.currentValue),
    weight: num(entry.values.weight, 1),
    dueDate: entry.values.dueDate ?? undefined,
  };
}

export function mapCheckIn(entry: {
  id: string;
  changeVector?: string | null;
  values: {
    title?: string | null;
    keyResultId?: string | null;
    author?: Parameters<typeof mapUser>[0];
    value?: unknown;
    status?: Combo;
    checkInDate?: string | null;
    comment?: string | null;
  };
}): CheckInRecord {
  return {
    id: entry.id,
    changeVector: entry.changeVector ?? undefined,
    title: entry.values.title ?? "",
    keyResultId: entry.values.keyResultId ?? "",
    author: mapUser(entry.values.author),
    value: num(entry.values.value),
    status: parseTrafficStatus(entry.values.status),
    checkInDate: entry.values.checkInDate ?? "",
    comment: entry.values.comment ?? undefined,
  };
}

function stripHtml(html?: string | null): string | undefined {
  if (!html) return undefined;
  const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return text || undefined;
}
