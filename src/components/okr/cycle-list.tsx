"use client";

import { useState, useTransition } from "react";
import { deleteCycleAction } from "@/app/(app)/cycles/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CycleRecord } from "@/lib/consolidate/mappers";
import { CycleForm } from "./cycle-form";

interface CycleListProps {
  cycles: CycleRecord[];
}

export function CycleList({ cycles }: CycleListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onDelete(id: string) {
    startTransition(async () => {
      const result = await deleteCycleAction(id);
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

      {cycles.length === 0 ? (
        <p className="text-sm text-muted-foreground">Noch keine Zyklen vorhanden.</p>
      ) : (
        cycles.map((cycle) => (
          <Card key={cycle.id} className="shadow-none">
            <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
              <div>
                <CardTitle className="text-base">{cycle.title}</CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">
                  {cycle.startDate} → {cycle.endDate} · {cycle.cycleType} ·{" "}
                  {cycle.status}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setEditingId((id) => (id === cycle.id ? null : cycle.id))
                  }
                >
                  {editingId === cycle.id ? "Schließen" : "Bearbeiten"}
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  disabled={pending}
                  onClick={() => onDelete(cycle.id)}
                >
                  Löschen
                </Button>
              </div>
            </CardHeader>
            {editingId === cycle.id ? (
              <CardContent>
                <CycleForm
                  cycle={cycle}
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
