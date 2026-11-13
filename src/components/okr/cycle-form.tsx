"use client";

import { useActionState, useEffect } from "react";
import {
  createCycleAction,
  updateCycleAction,
  type ActionResult,
} from "@/app/(app)/cycles/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  CYCLE_STATUS_OPTIONS,
  CYCLE_TYPE_OPTIONS,
} from "@/lib/consolidate/enums";
import type { CycleRecord } from "@/lib/consolidate/mappers";
import { cn } from "@/lib/utils";
import { NativeSelect } from "./form-field";

const initial: ActionResult | null = null;

interface CycleFormProps {
  cycle?: CycleRecord;
  compact?: boolean;
  onSuccess?: () => void;
}

export function CycleForm({
  cycle,
  compact = false,
  onSuccess,
}: CycleFormProps) {
  const action = cycle ? updateCycleAction : createCycleAction;
  const [state, formAction, pending] = useActionState(action, initial);

  useEffect(() => {
    if (state?.ok) onSuccess?.();
  }, [state, onSuccess]);

  const pair = cn("grid min-w-0 gap-3", !compact && "sm:grid-cols-2");

  return (
    <form action={formAction} className="grid min-w-0 gap-3 overflow-hidden">
      {cycle ? (
        <>
          <input type="hidden" name="id" value={cycle.id} />
          <input
            type="hidden"
            name="changeVector"
            value={cycle.changeVector ?? ""}
          />
        </>
      ) : null}

      <div className="grid min-w-0 gap-2">
        <Label htmlFor="title">Titel</Label>
        <Input
          id="title"
          name="title"
          required
          defaultValue={cycle?.title ?? ""}
          placeholder="Q1 2026"
        />
      </div>

      <div className="grid min-w-0 gap-2">
        <Label htmlFor="description">Beschreibung</Label>
        <Textarea
          id="description"
          name="description"
          rows={2}
          className="min-w-0"
          defaultValue={cycle?.description ?? ""}
        />
      </div>

      <div className={pair}>
        <div className="grid min-w-0 gap-2">
          <Label htmlFor="startDate">Start</Label>
          <Input
            id="startDate"
            name="startDate"
            type="date"
            required
            defaultValue={cycle?.startDate ?? ""}
          />
        </div>
        <div className="grid min-w-0 gap-2">
          <Label htmlFor="endDate">Ende</Label>
          <Input
            id="endDate"
            name="endDate"
            type="date"
            required
            defaultValue={cycle?.endDate ?? ""}
          />
        </div>
      </div>

      <div className={pair}>
        <div className="grid min-w-0 gap-2">
          <Label htmlFor="cycleType">Typ</Label>
          <NativeSelect
            id="cycleType"
            name="cycleType"
            defaultValue={cycle?.cycleType ?? "quarter"}
          >
            {CYCLE_TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="grid min-w-0 gap-2">
          <Label htmlFor="status">Status</Label>
          <NativeSelect
            id="status"
            name="status"
            defaultValue={cycle?.status ?? "active"}
          >
            {CYCLE_STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
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
      {state?.ok ? (
        <p className="text-sm text-emerald-700 dark:text-emerald-400">
          Gespeichert.
        </p>
      ) : null}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Speichern…" : cycle ? "Aktualisieren" : "Zyklus anlegen"}
      </Button>
    </form>
  );
}
