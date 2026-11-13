/** Domain types for the OKR layer (mapped from Consolidate data entries). */

export type OkrRole = "admin" | "team_lead" | "member";

export type CycleType = "quarter" | "year" | "custom";
export type CycleStatus = "draft" | "active" | "closed";

export type ObjectiveLevel = "company" | "team" | "individual";
export type ObjectiveLifecycleStatus =
  | "draft"
  | "on_track"
  | "at_risk"
  | "off_track"
  | "completed";

export type TrafficStatus = "on_track" | "at_risk" | "off_track";

export type MetricType = "percent" | "currency" | "number" | "boolean";

export interface OkrCycle {
  id: string;
  title: string;
  description?: string;
  startDate: string; // ISO date
  endDate: string; // ISO date
  cycleType: CycleType;
  status: CycleStatus;
}

export interface OkrUserRef {
  id: string;
  displayName: string;
  email?: string;
}

export interface KeyResult {
  id: string;
  title: string;
  description?: string;
  objectiveId: string;
  owner: OkrUserRef;
  metricType: MetricType;
  unit?: string;
  startValue: number;
  targetValue: number;
  currentValue: number;
  /** Relative weight within the parent objective (default 1). */
  weight: number;
  status: TrafficStatus;
  dueDate?: string;
  lastCheckInAt?: string;
}

export interface Objective {
  id: string;
  title: string;
  description?: string;
  level: ObjectiveLevel;
  cycleId: string;
  parentObjectiveId?: string;
  owner: OkrUserRef;
  teamId?: string;
  teamName?: string;
  status: ObjectiveLifecycleStatus;
  /** Cached progress 0–100 from Consolidate. */
  progress: number;
  weight?: number;
  keyResults: KeyResult[];
}

/** Project linked via Consolidate Project field `Ziele`. */
export interface LinkedProject {
  id: string;
  name: string;
  databaseId?: string;
  /** Deep-link into Consolidate project detail (`/entry/:id`). */
  url?: string;
}

export type DrivePreviewType =
  | "Image"
  | "Video"
  | "Audio"
  | "Pdf"
  | "Office"
  | "Text"
  | "Other";

export type DriveGroupBy = "none" | "project" | "responsible" | "taskType";

/** created/modified: descending; name: A–Z. */
export type DriveSortBy = "created" | "modified" | "name";

/** Attachment from a Consolidate Task, enriched for Drive UI. */
export interface DriveDocument {
  id: string;
  name: string;
  size: number;
  contentType?: string;
  previewType: DrivePreviewType;
  createdAt?: string;
  modifiedAt?: string;
  /** Authenticated thumbnail proxy URL (same-origin). */
  thumbnailUrl: string;
  /** Opens Consolidate attachment viewer. */
  openUrl: string;
  task: {
    id: string;
    name: string;
    url?: string;
    status?: {
      name: string;
      category?: string;
    };
  };
  project?: {
    id: string;
    name: string;
  };
  responsible?: {
    id: string;
    name: string;
  };
  taskType?: {
    key: string;
    name: string;
    color?: string;
  };
}

export interface DriveDocumentGroup {
  key: string;
  label: string;
  documents: DriveDocument[];
}

export interface CheckInInput {
  keyResultId: string;
  value: number;
  status: TrafficStatus;
  comment?: string;
  checkInDate?: string;
}

export interface ProgressThresholds {
  /** Expected − actual ≥ this → at_risk. Default 10. */
  atRiskDelta: number;
  /** Expected − actual ≥ this → off_track. Default 20. */
  offTrackDelta: number;
}

export interface KeyResultProgress {
  keyResultId: string;
  progress: number;
  weight: number;
}

export interface ObjectiveProgressResult {
  progress: number;
  status: TrafficStatus;
  expectedProgress: number;
  delta: number;
  keyResults: KeyResultProgress[];
  asOf: string;
}
