"use client";

import { useMemo, useState } from "react";
import { MessageSquarePlusIcon, TargetIcon, UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress, ProgressLabel, ProgressValue } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { formatKeyResultRange } from "@/lib/okr/format";
import {
  calculateKeyResultProgress,
  calculateObjectiveProgress,
} from "@/lib/okr/progress";
import type {
  CheckInInput,
  KeyResult,
  Objective,
  OkrCycle,
  TrafficStatus,
} from "@/lib/okr/types";
import { cn } from "@/lib/utils";
import { CheckInModal } from "./check-in-modal";
import { StatusBadge } from "./status-badge";

const LEVEL_LABEL: Record<Objective["level"], string> = {
  company: "Unternehmen",
  team: "Team",
  individual: "Individuell",
};

export interface OkrCardProps {
  objective: Objective;
  cycle: Pick<OkrCycle, "startDate" | "endDate" | "title">;
  className?: string;
  /** Called when a quick check-in is submitted for a Key Result. */
  onCheckIn?: (input: CheckInInput) => Promise<void> | void;
}

export function OkrCard({ objective, cycle, className, onCheckIn }: OkrCardProps) {
  const [activeKr, setActiveKr] = useState<KeyResult | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const evaluation = useMemo(
    () =>
      calculateObjectiveProgress({
        keyResults: objective.keyResults,
        cycle,
      }),
    [objective.keyResults, cycle]
  );

  const displayStatus: TrafficStatus =
    objective.status === "completed" || objective.status === "draft"
      ? evaluation.status
      : evaluation.status;

  function openCheckIn(kr: KeyResult) {
    setActiveKr(kr);
    setModalOpen(true);
  }

  async function handleCheckIn(input: CheckInInput) {
    await onCheckIn?.(input);
  }

  return (
    <>
      <Card
        className={cn(
          "overflow-hidden border-border/80 shadow-none transition-colors hover:border-border",
          className
        )}
      >
        <CardHeader className="gap-3 border-b border-border/60 bg-muted/20">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1 rounded-md bg-background px-1.5 py-0.5 ring-1 ring-border/70">
                  <TargetIcon className="size-3" />
                  {LEVEL_LABEL[objective.level]}
                </span>
                {objective.teamName ? <span>{objective.teamName}</span> : null}
                <span aria-hidden>·</span>
                <span>{cycle.title}</span>
              </div>
              <CardTitle className="text-lg leading-snug text-balance">
                {objective.title}
              </CardTitle>
              {objective.description ? (
                <CardDescription className="line-clamp-2 text-pretty">
                  {objective.description}
                </CardDescription>
              ) : null}
            </div>
            <StatusBadge status={displayStatus} />
          </div>

          <div className="space-y-2">
            <Progress value={evaluation.progress} className="gap-2">
              <div className="flex w-full items-baseline justify-between gap-2">
                <ProgressLabel className="text-xs text-muted-foreground">
                  Objective-Fortschritt
                </ProgressLabel>
                <ProgressValue className="text-xs font-medium text-foreground">
                  {(_formatted, value) => `${Number(value ?? 0).toFixed(1)} %`}
                </ProgressValue>
              </div>
            </Progress>
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
              <span>
                Erwartet laut Zyklus:{" "}
                <span className="tabular-nums text-foreground">
                  {evaluation.expectedProgress.toFixed(1)} %
                </span>
              </span>
              <span className="inline-flex items-center gap-1">
                <UserIcon className="size-3" />
                {objective.owner.displayName}
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="grid gap-0 px-0">
          {objective.keyResults.length === 0 ? (
            <p className="px-4 py-6 text-sm text-muted-foreground">
              Noch keine Key Results verknüpft.
            </p>
          ) : (
            objective.keyResults.map((kr, index) => {
              const krProgress = calculateKeyResultProgress(kr);
              return (
                <div key={kr.id}>
                  {index > 0 ? <Separator /> : null}
                  <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-medium">{kr.title}</p>
                        <StatusBadge status={kr.status} className="h-5" />
                      </div>
                      <Progress value={krProgress} className="max-w-md gap-1.5">
                        <div className="flex w-full items-baseline justify-between gap-2">
                          <ProgressLabel className="text-[11px] text-muted-foreground">
                            {formatKeyResultRange(kr)}
                            {kr.weight !== 1 ? ` · Gewicht ${kr.weight}` : ""}
                          </ProgressLabel>
                          <ProgressValue className="text-[11px] tabular-nums">
                            {(_formatted, value) =>
                              `${Number(value ?? 0).toFixed(0)} %`
                            }
                          </ProgressValue>
                        </div>
                      </Progress>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="shrink-0 self-start sm:self-center"
                      onClick={() => openCheckIn(kr)}
                    >
                      <MessageSquarePlusIcon />
                      Check-in
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      <CheckInModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        keyResult={activeKr}
        onSubmit={handleCheckIn}
      />
    </>
  );
}
