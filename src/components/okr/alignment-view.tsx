"use client";

import { useMemo, useState } from "react";
import {
  buildAlignmentForest,
  collectAlignmentWithRelated,
  countAlignmentNodes,
  type AlignmentObjective,
} from "@/lib/okr/alignment";
import { AlignmentTree } from "./alignment-tree";

interface AlignmentViewProps {
  objectives: AlignmentObjective[];
  cycles: Array<{ id: string; title: string; status: string }>;
}

export function AlignmentView({ objectives, cycles }: AlignmentViewProps) {
  const activeCycle =
    cycles.find((c) => c.status === "active") ?? cycles[0] ?? null;
  const [cycleId, setCycleId] = useState<string>(activeCycle?.id ?? "all");

  const scoped = useMemo(
    () => collectAlignmentWithRelated(objectives, cycleId),
    [objectives, cycleId]
  );

  const forest = useMemo(
    () => buildAlignmentForest(scoped, cycleId),
    [scoped, cycleId]
  );
  const totals = countAlignmentNodes(forest);
  const inCycle =
    cycleId === "all"
      ? totals.objectives
      : scoped.filter((o) => o.cycleId === cycleId).length;
  const contextCount = totals.objectives - inCycle;

  const cycleTitleById = useMemo(
    () => Object.fromEntries(cycles.map((c) => [c.id, c.title])),
    [cycles]
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Alignment</h1>
          <p className="text-sm text-muted-foreground">
            Hierarchie inkl. Key Results · Parent/Child auch über Zyklusgrenzen
          </p>
        </div>
        <div className="grid gap-1">
          <label htmlFor="alignment-cycle" className="text-xs text-muted-foreground">
            Zyklus
          </label>
          <select
            id="alignment-cycle"
            value={cycleId}
            onChange={(e) => setCycleId(e.target.value)}
            className="h-8 min-w-[10rem] rounded-lg border border-input bg-transparent px-2.5 text-sm"
          >
            <option value="all">Alle Zyklen</option>
            {cycles.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        {inCycle} im Zyklus
        {contextCount > 0 ? ` · ${contextCount} Kontext (anderer Zyklus)` : ""}
        {" · "}
        {totals.keyResults} Key Result{totals.keyResults === 1 ? "" : "s"} ·{" "}
        {forest.length} Wurzel{forest.length === 1 ? "" : "n"}
      </p>

      <AlignmentTree forest={forest} cycleTitleById={cycleTitleById} />
    </div>
  );
}
