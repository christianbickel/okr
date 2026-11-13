"use client";

import { useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatMetricValue } from "@/lib/okr/format";
import { calculateKeyResultProgress } from "@/lib/okr/progress";
import { TRAFFIC_STATUS_LABEL, TRAFFIC_STATUS_ORDER } from "@/lib/okr/status";
import type { CheckInInput, KeyResult, TrafficStatus } from "@/lib/okr/types";
import { StatusBadge } from "./status-badge";

interface CheckInModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  keyResult: KeyResult | null;
  onSubmit: (input: CheckInInput) => Promise<void> | void;
}

export function CheckInModal({
  open,
  onOpenChange,
  keyResult,
  onSubmit,
}: CheckInModalProps) {
  const [value, setValue] = useState("");
  const [status, setStatus] = useState<TrafficStatus>("on_track");
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const previewProgress = useMemo(() => {
    if (!keyResult) return null;
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return null;
    return calculateKeyResultProgress({
      ...keyResult,
      currentValue: numeric,
    });
  }, [keyResult, value]);

  function resetForm(kr: KeyResult | null) {
    setValue(kr ? String(kr.currentValue) : "");
    setStatus(kr?.status ?? "on_track");
    setComment("");
    setError(null);
  }

  function handleOpenChange(next: boolean) {
    if (next && keyResult) {
      resetForm(keyResult);
    }
    if (!next) {
      setError(null);
    }
    onOpenChange(next);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!keyResult) return;

    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
      setError("Bitte einen gültigen Zahlenwert eingeben.");
      return;
    }

    if (keyResult.metricType === "boolean" && numeric !== 0 && numeric !== 1) {
      setError("Ja/Nein-Meilensteine erwarten 0 (offen) oder 1 (erreicht).");
      return;
    }

    startTransition(async () => {
      try {
        await onSubmit({
          keyResultId: keyResult.id,
          value: numeric,
          status,
          comment: comment.trim() || undefined,
          checkInDate: new Date().toISOString().slice(0, 10),
        });
        onOpenChange(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Check-in fehlgeschlagen.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md" showCloseButton>
        <DialogHeader>
          <DialogTitle>Quick Check-in</DialogTitle>
          <DialogDescription>
            {keyResult
              ? `Aktualisiere „${keyResult.title}“ mit aktuellem Wert und Ampelstatus.`
              : "Key Result auswählen."}
          </DialogDescription>
        </DialogHeader>

        {keyResult ? (
          <form className="grid gap-4" onSubmit={handleSubmit}>
            <div className="rounded-lg border bg-muted/40 px-3 py-2 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">Aktuell</span>
                <span className="font-medium tabular-nums">
                  {formatMetricValue(
                    keyResult.currentValue,
                    keyResult.metricType,
                    keyResult.unit
                  )}
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between gap-2">
                <span className="text-muted-foreground">Ziel</span>
                <span className="tabular-nums">
                  {formatMetricValue(
                    keyResult.targetValue,
                    keyResult.metricType,
                    keyResult.unit
                  )}
                </span>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="checkin-value">
                Neuer Wert
                {keyResult.metricType === "boolean" ? " (0 / 1)" : ""}
              </Label>
              <Input
                id="checkin-value"
                inputMode="decimal"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                required
                autoFocus
              />
              {previewProgress !== null ? (
                <p className="text-xs text-muted-foreground">
                  Vorschau-Fortschritt:{" "}
                  <span className="font-medium tabular-nums text-foreground">
                    {previewProgress.toFixed(1)} %
                  </span>
                </p>
              ) : null}
            </div>

            <div className="grid gap-2">
              <Label>Status</Label>
              <Select
                value={status}
                onValueChange={(next) => {
                  if (next) setStatus(next as TrafficStatus);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TRAFFIC_STATUS_ORDER.map((item) => (
                    <SelectItem key={item} value={item}>
                      <span className="flex items-center gap-2">
                        <StatusBadge status={item} showDot className="pointer-events-none" />
                        <span className="sr-only">{TRAFFIC_STATUS_LABEL[item]}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="checkin-comment">Kommentar (optional)</Label>
              <Textarea
                id="checkin-comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Kurzes Update für das Team…"
                rows={3}
                maxLength={500}
              />
            </div>

            {error ? (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}

            <DialogFooter className="mx-0 mb-0 rounded-none border-0 bg-transparent p-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Abbrechen
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Speichern…" : "Check-in speichern"}
              </Button>
            </DialogFooter>
          </form>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
