import type { TrafficStatus } from "./types";

export const TRAFFIC_STATUS_LABEL: Record<TrafficStatus, string> = {
  on_track: "On Track",
  at_risk: "At Risk",
  off_track: "Off Track",
};

export const TRAFFIC_STATUS_ORDER: TrafficStatus[] = [
  "on_track",
  "at_risk",
  "off_track",
];

export function trafficStatusLabel(status: TrafficStatus): string {
  return TRAFFIC_STATUS_LABEL[status];
}
