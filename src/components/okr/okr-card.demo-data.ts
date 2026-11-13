import type { Objective, OkrCycle } from "@/lib/okr/types";

/** Sample data for local UI development (not loaded from Consolidate). */
export const DEMO_CYCLE: OkrCycle = {
  id: "cyc-demo-q1",
  title: "Q1 2026",
  startDate: "2026-01-01",
  endDate: "2026-03-31",
  cycleType: "quarter",
  status: "active",
};

export const DEMO_OBJECTIVE: Objective = {
  id: "obj-demo-1",
  title: "Kundenbindung im Enterprise-Segment steigern",
  description:
    "Wir wollen wiederkehrende Enterprise-Kunden durch bessere Adoption und Support-Qualität halten.",
  level: "company",
  cycleId: DEMO_CYCLE.id,
  owner: {
    id: "user-1",
    displayName: "Alex Müller",
    email: "alex@example.com",
  },
  teamName: "Customer Success",
  status: "at_risk",
  progress: 42,
  keyResults: [
    {
      id: "kr-1",
      title: "NPS Enterprise von 32 auf 45 steigern",
      objectiveId: "obj-demo-1",
      owner: { id: "user-2", displayName: "Sam Keller" },
      metricType: "number",
      unit: "Punkte",
      startValue: 32,
      targetValue: 45,
      currentValue: 38,
      weight: 2,
      status: "on_track",
    },
    {
      id: "kr-2",
      title: "Churn auf unter 4 % senken",
      objectiveId: "obj-demo-1",
      owner: { id: "user-1", displayName: "Alex Müller" },
      metricType: "percent",
      unit: "%",
      startValue: 7,
      targetValue: 4,
      currentValue: 5.5,
      weight: 2,
      status: "at_risk",
    },
    {
      id: "kr-3",
      title: "QBR-Playbook für Top-20-Accounts live",
      objectiveId: "obj-demo-1",
      owner: { id: "user-3", displayName: "Jordan Weiss" },
      metricType: "boolean",
      startValue: 0,
      targetValue: 1,
      currentValue: 0,
      weight: 1,
      status: "off_track",
    },
  ],
};
