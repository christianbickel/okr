"use client";

import { useActionState, useEffect } from "react";
import {
  createKeyResultAction,
  type ActionResult,
} from "@/app/(app)/objectives/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  METRIC_TYPE_OPTIONS,
  TRAFFIC_STATUS_OPTIONS,
} from "@/lib/consolidate/enums";
import type { OkrUserRef } from "@/lib/okr/types";
import { UserSelect } from "./user-select";

const initial: ActionResult | null = null;

interface KeyResultFormProps {
  objectiveId: string;
  users: OkrUserRef[];
  defaultOwnerId?: string;
  onSuccess?: () => void;
}

export function KeyResultForm({
  objectiveId,
  users,
  defaultOwnerId,
  onSuccess,
}: KeyResultFormProps) {
  const [state, formAction, pending] = useActionState(
    createKeyResultAction,
    initial
  );

  useEffect(() => {
    if (state?.ok) onSuccess?.();
  }, [state, onSuccess]);

  return (
    <form action={formAction} className="grid gap-3">
      <input type="hidden" name="objectiveId" value={objectiveId} />

      <div className="grid gap-2">
        <Label htmlFor="kr-title">Titel</Label>
        <Input
          id="kr-title"
          name="title"
          required
          placeholder="NPS von 40 auf 55 steigern"
        />
      </div>

      <UserSelect users={users} defaultValue={defaultOwnerId} label="Owner" />

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="metricType">Metrik</Label>
          <select
            id="metricType"
            name="metricType"
            defaultValue="number"
            className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
          >
            {METRIC_TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="unit">Einheit</Label>
          <Input id="unit" name="unit" placeholder="%, €, …" />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="grid gap-2">
          <Label htmlFor="startValue">Start</Label>
          <Input
            id="startValue"
            name="startValue"
            type="number"
            step="any"
            defaultValue={0}
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="targetValue">Ziel</Label>
          <Input
            id="targetValue"
            name="targetValue"
            type="number"
            step="any"
            defaultValue={100}
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="currentValue">Aktuell</Label>
          <Input
            id="currentValue"
            name="currentValue"
            type="number"
            step="any"
            defaultValue={0}
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="grid gap-2">
          <Label htmlFor="kr-weight">Gewicht</Label>
          <Input
            id="kr-weight"
            name="weight"
            type="number"
            step="0.1"
            min="0"
            defaultValue={1}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="kr-status">Status</Label>
          <select
            id="kr-status"
            name="status"
            defaultValue="on_track"
            className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
          >
            {TRAFFIC_STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="dueDate">Fällig</Label>
          <Input id="dueDate" name="dueDate" type="date" />
        </div>
      </div>

      {state && !state.ok ? (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}
      {state?.ok ? (
        <p className="text-sm text-emerald-700 dark:text-emerald-400">
          Key Result angelegt.
        </p>
      ) : null}

      <Button type="submit" disabled={pending}>
        {pending ? "Speichern…" : "Key Result anlegen"}
      </Button>
    </form>
  );
}
