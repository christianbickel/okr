"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  deleteKeyResultAction,
  submitCheckInAction,
} from "@/app/(app)/objectives/actions";
import { Button } from "@/components/ui/button";
import type { CycleRecord, ObjectiveRecord } from "@/lib/consolidate/mappers";
import type {
  CheckInInput,
  LinkedProject,
  Objective,
  OkrUserRef,
} from "@/lib/okr/types";
import { KeyResultForm } from "./key-result-form";
import { ObjectiveForm } from "./objective-form";
import { OkrCard } from "./okr-card";
import { ProjectLinks } from "./project-links";

interface ObjectiveDetailProps {
  objective: ObjectiveRecord;
  cycle: CycleRecord;
  cycles: CycleRecord[];
  parentObjectives: ObjectiveRecord[];
  users: OkrUserRef[];
  projects?: LinkedProject[];
  projectsUnauthorized?: boolean;
  initialAddingKr?: boolean;
}

export function ObjectiveDetail({
  objective,
  cycle,
  cycles,
  parentObjectives,
  users,
  projects = [],
  projectsUnauthorized = false,
  initialAddingKr = false,
}: ObjectiveDetailProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [addingKr, setAddingKr] = useState(initialAddingKr);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const cardObjective: Objective = {
    ...objective,
    keyResults: objective.keyResults ?? [],
  };

  async function onCheckIn(input: CheckInInput) {
    const result = await submitCheckInAction({
      ...input,
      objectiveId: objective.id,
    });
    if (!result.ok) throw new Error(result.error);
    router.refresh();
  }

  function onDeleteKr(id: string) {
    startTransition(async () => {
      const result = await deleteKeyResultAction(id, objective.id);
      if (!result.ok) setError(result.error);
      else {
        setError(null);
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            {objective.title}
          </h1>
          <p className="text-sm text-muted-foreground">
            {cycle.title} · {objective.level}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setEditing((v) => !v)}
          >
            {editing ? "Formular schließen" : "Bearbeiten"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setAddingKr((v) => !v)}
          >
            {addingKr ? "KR-Formular schließen" : "Key Result"}
          </Button>
        </div>
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      {editing ? (
        <div className="rounded-xl border border-border/80 p-4">
          <ObjectiveForm
            objective={objective}
            cycles={cycles}
            users={users}
            parentObjectives={parentObjectives}
            onSuccess={() => {
              setEditing(false);
              router.refresh();
            }}
          />
        </div>
      ) : null}

      {addingKr ? (
        <div className="rounded-xl border border-border/80 p-4">
          <h2 className="mb-3 text-sm font-medium">Neues Key Result</h2>
          <KeyResultForm
            objectiveId={objective.id}
            users={users}
            defaultOwnerId={objective.owner.id}
            onSuccess={() => {
              setAddingKr(false);
              router.refresh();
            }}
          />
        </div>
      ) : null}

      <OkrCard
        objective={cardObjective}
        cycle={cycle}
        onCheckIn={onCheckIn}
      />

      <ProjectLinks
        projects={projects}
        unauthorized={projectsUnauthorized}
      />

      {(objective.keyResults ?? []).length > 0 ? (
        <div className="space-y-2">
          <h2 className="text-sm font-medium text-muted-foreground">
            Key Results verwalten
          </h2>
          <ul className="divide-y rounded-xl border border-border/80">
            {(objective.keyResults ?? []).map((kr) => (
              <li
                key={kr.id}
                className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
              >
                <span className="min-w-0 truncate">{kr.title}</span>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  disabled={pending}
                  onClick={() => onDeleteKr(kr.id)}
                >
                  Löschen
                </Button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
