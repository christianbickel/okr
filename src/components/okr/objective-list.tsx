"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { deleteObjectiveAction } from "@/app/(app)/objectives/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CycleRecord, ObjectiveRecord } from "@/lib/consolidate/mappers";
import { objectivePath } from "@/lib/okr/paths";
import type { LinkedProject, OkrUserRef } from "@/lib/okr/types";
import { ObjectiveForm } from "./objective-form";
import { ProjectLinks } from "./project-links";
import { StatusBadge } from "./status-badge";

interface ObjectiveListProps {
  objectives: ObjectiveRecord[];
  cycles: CycleRecord[];
  users: OkrUserRef[];
  projectsByObjectiveId?: Record<string, LinkedProject[]>;
}

export function ObjectiveList({
  objectives,
  cycles,
  users,
  projectsByObjectiveId = {},
}: ObjectiveListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const cycleTitle = (id: string) =>
    cycles.find((c) => c.id === id)?.title ?? id;

  function onDelete(id: string) {
    startTransition(async () => {
      const result = await deleteObjectiveAction(id);
      if (!result.ok) setError(result.error);
      else setError(null);
    });
  }

  return (
    <div className="space-y-4">
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      {objectives.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Noch keine Objectives vorhanden.
        </p>
      ) : (
        objectives.map((objective) => (
          <Card key={objective.id} className="shadow-none">
            <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
              <div className="min-w-0 space-y-1">
                <CardTitle className="text-base">
                  <Link
                    href={objectivePath(objective.id)}
                    className="hover:underline"
                  >
                    {objective.title}
                  </Link>
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  {cycleTitle(objective.cycleId)} · {objective.level} ·{" "}
                  {objective.progress.toFixed(0)} %
                </p>
                {objective.status === "draft" ||
                objective.status === "completed" ? (
                  <span className="text-xs text-muted-foreground">
                    {objective.status}
                  </span>
                ) : (
                  <StatusBadge status={objective.status} />
                )}
                <ProjectLinks
                  projects={projectsByObjectiveId[objective.id] ?? []}
                  compact
                />
              </div>
              <div className="flex shrink-0 gap-2">
                <Link
                  href={objectivePath(objective.id)}
                  className="inline-flex h-7 items-center rounded-lg border border-border px-2.5 text-[0.8rem] font-medium hover:bg-muted"
                >
                  Öffnen
                </Link>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setEditingId((id) =>
                      id === objective.id ? null : objective.id
                    )
                  }
                >
                  {editingId === objective.id ? "Schließen" : "Bearbeiten"}
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  disabled={pending}
                  onClick={() => onDelete(objective.id)}
                >
                  Löschen
                </Button>
              </div>
            </CardHeader>
            {editingId === objective.id ? (
              <CardContent>
                <ObjectiveForm
                  objective={objective}
                  cycles={cycles}
                  users={users}
                  parentObjectives={objectives}
                  onSuccess={() => setEditingId(null)}
                />
              </CardContent>
            ) : null}
          </Card>
        ))
      )}
    </div>
  );
}
