"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { AlignmentKeyResult, AlignmentNode } from "@/lib/okr/alignment";
import { formatKeyResultRange } from "@/lib/okr/format";
import { objectivePath } from "@/lib/okr/paths";
import { calculateKeyResultProgress } from "@/lib/okr/progress";
import type { ObjectiveLevel } from "@/lib/okr/types";
import { cn } from "@/lib/utils";
import { StatusBadge } from "./status-badge";

const LEVEL_LABEL: Record<ObjectiveLevel, string> = {
  company: "Unternehmen",
  team: "Team",
  individual: "Individuell",
};

interface AlignmentTreeProps {
  forest: AlignmentNode[];
  cycleTitleById: Record<string, string>;
}

export function AlignmentTree({ forest, cycleTitleById }: AlignmentTreeProps) {
  if (forest.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Keine Objectives für diesen Filter. Unter{" "}
        <Link href="/objectives" className="underline">
          Objectives
        </Link>{" "}
        anlegen und optional ein Parent setzen.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {forest.map((node) => (
        <AlignmentBranch
          key={node.id}
          node={node}
          depth={0}
          cycleTitleById={cycleTitleById}
        />
      ))}
    </ul>
  );
}

function AlignmentBranch({
  node,
  depth,
  cycleTitleById,
}: {
  node: AlignmentNode;
  depth: number;
  cycleTitleById: Record<string, string>;
}) {
  const hasChildren = node.children.length > 0;
  const hasKeyResults = node.keyResults.length > 0;
  const expandable = hasChildren || hasKeyResults;
  const [open, setOpen] = useState(depth < 2 || Boolean(node.outOfCycle));

  const orphanHint = useMemo(() => {
    if (node.parentObjectiveId && !node.outOfCycle) {
      return "Parent fehlt in Filter/Daten";
    }
    if (node.level !== "company" && !node.parentObjectiveId) return "ohne Parent";
    return null;
  }, [node.level, node.parentObjectiveId, node.outOfCycle]);

  return (
    <li className="min-w-0">
      <div
        className={cn(
          "flex min-w-0 items-start gap-2 rounded-lg border px-3 py-2.5",
          node.outOfCycle
            ? "border-dashed border-border/50 bg-muted/30 text-muted-foreground"
            : "border-border/70 bg-background",
          depth > 0 && !node.outOfCycle && "border-l-2 border-l-border"
        )}
        style={depth > 0 ? { marginLeft: Math.min(depth, 6) * 12 } : undefined}
      >
        {expandable ? (
          <button
            type="button"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-md text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            {open ? "−" : "+"}
          </button>
        ) : (
          <span className="mt-0.5 inline-flex size-6 shrink-0" aria-hidden />
        )}

        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <Link
              href={objectivePath(node.id)}
              className="truncate text-sm font-medium hover:underline"
            >
              {node.title}
            </Link>
            <span className="rounded-md bg-muted px-1.5 py-0.5 text-[0.7rem] text-muted-foreground">
              {LEVEL_LABEL[node.level]}
            </span>
            {node.outOfCycle ? (
              <span className="rounded-md border border-dashed border-border px-1.5 py-0.5 text-[0.7rem]">
                anderer Zyklus
              </span>
            ) : null}
            {orphanHint && node.level !== "company" && !node.parentObjectiveId ? (
              <span className="text-[0.7rem] text-amber-700 dark:text-amber-400">
                {orphanHint}
              </span>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="truncate">{node.ownerName}</span>
            {node.teamName ? <span className="truncate">{node.teamName}</span> : null}
            <span className="tabular-nums">{node.progress.toFixed(0)} %</span>
            <span className="truncate">
              {cycleTitleById[node.cycleId] ?? "Zyklus?"}
            </span>
            {hasKeyResults ? (
              <span className="tabular-nums">
                {node.keyResults.length} KR
                {node.keyResults.length === 1 ? "" : "s"}
              </span>
            ) : null}
            {node.status === "draft" || node.status === "completed" ? (
              <span>{node.status}</span>
            ) : (
              <StatusBadge status={node.status} className="scale-90" />
            )}
          </div>
        </div>

        {hasChildren ? (
          <span className="shrink-0 rounded-md bg-muted px-1.5 py-0.5 text-[0.7rem] tabular-nums text-muted-foreground">
            {node.children.length}
          </span>
        ) : null}
      </div>

      {open && expandable ? (
        <div
          className="mt-2 space-y-2"
          style={{ marginLeft: Math.min(depth, 6) * 12 }}
        >
          {hasKeyResults ? (
            <ul className="space-y-1.5 pl-8">
              {node.keyResults.map((kr) => (
                <KeyResultRow key={kr.id} kr={kr} objectiveId={node.id} />
              ))}
            </ul>
          ) : null}

          {hasChildren ? (
            <ul className="space-y-2">
              {node.children.map((child) => (
                <AlignmentBranch
                  key={child.id}
                  node={child}
                  depth={depth + 1}
                  cycleTitleById={cycleTitleById}
                />
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}

function KeyResultRow({
  kr,
  objectiveId,
}: {
  kr: AlignmentKeyResult;
  objectiveId: string;
}) {
  const progress = calculateKeyResultProgress(kr);

  return (
    <li className="flex min-w-0 items-start gap-2 rounded-md border border-dashed border-border/60 bg-muted/20 px-3 py-2">
      <span
        aria-hidden
        className="mt-1.5 size-1.5 shrink-0 rounded-full bg-teal-500/80"
      />
      <div className="min-w-0 flex-1 space-y-0.5">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <Link
            href={objectivePath(objectiveId)}
            className="truncate text-sm hover:underline"
          >
            {kr.title}
          </Link>
          <span className="rounded-md bg-teal-500/10 px-1.5 py-0.5 text-[0.7rem] text-teal-800 dark:text-teal-300">
            Key Result
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="truncate">{kr.ownerName}</span>
          <span className="tabular-nums">{formatKeyResultRange(kr)}</span>
          <span className="tabular-nums">{progress.toFixed(0)} %</span>
          <StatusBadge status={kr.status} className="scale-90" />
        </div>
      </div>
    </li>
  );
}
