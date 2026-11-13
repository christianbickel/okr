import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AlignmentView } from "@/components/okr/alignment-view";
import { isSetupComplete } from "@/lib/consolidate/config";
import {
  listCycles,
  listKeyResults,
  listObjectives,
} from "@/lib/consolidate/okr-repository";

async function AlignmentContent() {
  if (!(await isSetupComplete())) redirect("/setup");

  const [objectives, keyResults, cycles] = await Promise.all([
    listObjectives(),
    listKeyResults(),
    listCycles(),
  ]);

  const krsByObjective = new Map<string, typeof keyResults>();
  for (const kr of keyResults) {
    const list = krsByObjective.get(kr.objectiveId) ?? [];
    list.push(kr);
    krsByObjective.set(kr.objectiveId, list);
  }

  return (
    <AlignmentView
      objectives={objectives.map((o) => ({
        id: o.id,
        title: o.title,
        level: o.level,
        cycleId: o.cycleId,
        parentObjectiveId: o.parentObjectiveId,
        ownerName: o.owner.displayName,
        teamName: o.teamName,
        status: o.status,
        progress: o.progress,
        keyResults: (krsByObjective.get(o.id) ?? []).map((kr) => ({
          id: kr.id,
          title: kr.title,
          ownerName: kr.owner.displayName,
          metricType: kr.metricType,
          unit: kr.unit,
          startValue: kr.startValue,
          targetValue: kr.targetValue,
          currentValue: kr.currentValue,
          weight: kr.weight,
          status: kr.status,
        })),
      }))}
      cycles={cycles.map((c) => ({
        id: c.id,
        title: c.title,
        status: c.status,
      }))}
    />
  );
}

export default function AlignmentPage() {
  return (
    <Suspense
      fallback={<div className="h-40 animate-pulse rounded-xl bg-muted/50" />}
    >
      <AlignmentContent />
    </Suspense>
  );
}
