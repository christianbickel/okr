"use client";

import { useActionState, useEffect } from "react";
import {
  createObjectiveAction,
  updateObjectiveAction,
  type ActionResult,
} from "@/app/(app)/objectives/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  OBJECTIVE_LEVEL_OPTIONS,
  OBJECTIVE_STATUS_OPTIONS,
} from "@/lib/consolidate/enums";
import type { CycleRecord, ObjectiveRecord } from "@/lib/consolidate/mappers";
import type { OkrUserRef } from "@/lib/okr/types";
import { cn } from "@/lib/utils";
import { NativeSelect } from "./form-field";
import { UserSelect } from "./user-select";

const initial: ActionResult | null = null;

interface ObjectiveFormProps {
  objective?: ObjectiveRecord;
  cycles: CycleRecord[];
  users: OkrUserRef[];
  parentObjectives?: ObjectiveRecord[];
  defaultCycleId?: string;
  /** Single-column layout for narrow sidebars. */
  compact?: boolean;
  onSuccess?: () => void;
}

export function ObjectiveForm({
  objective,
  cycles,
  users,
  parentObjectives = [],
  defaultCycleId,
  compact = false,
  onSuccess,
}: ObjectiveFormProps) {
  const action = objective ? updateObjectiveAction : createObjectiveAction;
  const [state, formAction, pending] = useActionState(action, initial);

  useEffect(() => {
    if (state?.ok) onSuccess?.();
  }, [state, onSuccess]);

  const pair = cn("grid min-w-0 gap-3", !compact && "sm:grid-cols-2");

  return (
    <form action={formAction} className="grid min-w-0 gap-3 overflow-hidden">
      {objective ? (
        <>
          <input type="hidden" name="id" value={objective.id} />
          <input
            type="hidden"
            name="changeVector"
            value={objective.changeVector ?? ""}
          />
        </>
      ) : null}

      <div className="grid min-w-0 gap-2">
        <Label htmlFor="obj-title">Titel</Label>
        <Input
          id="obj-title"
          name="title"
          required
          defaultValue={objective?.title ?? ""}
          placeholder="Marktanteil im DACH-Raum ausbauen"
        />
      </div>

      <div className="grid min-w-0 gap-2">
        <Label htmlFor="obj-description">Beschreibung</Label>
        <Textarea
          id="obj-description"
          name="description"
          rows={2}
          className="min-w-0"
          defaultValue={objective?.description ?? ""}
        />
      </div>

      <div className={pair}>
        <div className="grid min-w-0 gap-2">
          <Label htmlFor="cycleId">Zyklus</Label>
          <NativeSelect
            id="cycleId"
            name="cycleId"
            required
            defaultValue={objective?.cycleId ?? defaultCycleId ?? ""}
          >
            <option value="" disabled>
              Zyklus wählen…
            </option>
            {cycles.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="grid min-w-0 gap-2">
          <Label htmlFor="level">Ebene</Label>
          <NativeSelect
            id="level"
            name="level"
            defaultValue={objective?.level ?? "company"}
          >
            {OBJECTIVE_LEVEL_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </NativeSelect>
        </div>
      </div>

      <div className={pair}>
        <div className="grid min-w-0 gap-2">
          <Label htmlFor="obj-status">Status</Label>
          <NativeSelect
            id="obj-status"
            name="status"
            defaultValue={objective?.status ?? "draft"}
          >
            {OBJECTIVE_STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="grid min-w-0 gap-2">
          <Label htmlFor="weight">Gewicht</Label>
          <Input
            id="weight"
            name="weight"
            type="number"
            step="0.1"
            min="0"
            defaultValue={objective?.weight ?? 1}
          />
        </div>
      </div>

      <UserSelect
        users={users}
        defaultValue={objective?.owner.id}
        label="Owner"
      />

      <div className={pair}>
        <div className="grid min-w-0 gap-2">
          <Label htmlFor="teamName">Team</Label>
          <Input
            id="teamName"
            name="teamName"
            defaultValue={objective?.teamName ?? ""}
            placeholder="optional"
          />
        </div>
        <div className="grid min-w-0 gap-2">
          <Label htmlFor="parentObjectiveId">Parent Objective</Label>
          <NativeSelect
            id="parentObjectiveId"
            name="parentObjectiveId"
            defaultValue={objective?.parentObjectiveId ?? ""}
          >
            <option value="">— keines —</option>
            {parentObjectives
              .filter((p) => p.id !== objective?.id)
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
          </NativeSelect>
        </div>
      </div>

      {state && !state.ok ? (
        <p className="break-words text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}
      {state?.ok && objective ? (
        <p className="text-sm text-emerald-700 dark:text-emerald-400">
          Gespeichert.
        </p>
      ) : null}

      <Button type="submit" disabled={pending} className="w-full">
        {pending
          ? "Speichern…"
          : objective
            ? "Aktualisieren"
            : "Anlegen & Key Results"}
      </Button>
    </form>
  );
}
