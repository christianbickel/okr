import Link from "next/link";
import { drivePath } from "@/lib/okr/drive";
import type { DriveGroupBy, DriveSortBy } from "@/lib/okr/types";
import { cn } from "@/lib/utils";
import { DriveSearchField } from "./drive-search-field";

const GROUPS: Array<{ value: DriveGroupBy; label: string }> = [
  { value: "none", label: "Keine" },
  { value: "project", label: "Projekt" },
  { value: "responsible", label: "Verantwortlicher" },
  { value: "taskType", label: "Task-Typ" },
];

const SORTS: Array<{ value: DriveSortBy; label: string }> = [
  { value: "created", label: "Zuletzt erstellt" },
  { value: "modified", label: "Zuletzt geändert" },
  { value: "name", label: "Name" },
];

function SegmentedControl<T extends string>({
  label,
  options,
  value,
  hrefFor,
}: {
  label: string;
  options: Array<{ value: T; label: string }>;
  value: T;
  hrefFor: (next: T) => string;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      <div
        role="tablist"
        aria-label={label}
        className="inline-flex flex-wrap rounded-lg border border-border/80 bg-muted/40 p-0.5"
      >
        {options.map((option) => {
          const active = value === option.value;
          return (
            <Link
              key={option.value}
              href={hrefFor(option.value)}
              role="tab"
              aria-selected={active}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm transition-colors duration-150 ease-[cubic-bezier(0.2,0,0,1)]",
                active
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {option.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function DriveToolbar({
  groupBy,
  sortBy,
  total,
  page,
  pageSize,
  query,
}: {
  groupBy: DriveGroupBy;
  sortBy: DriveSortBy;
  total: number;
  page: number;
  pageSize: number;
  query: string;
}) {
  return (
    <div className="space-y-3 border-b border-border/70 pb-4">
      <DriveSearchField
        groupBy={groupBy}
        sortBy={sortBy}
        pageSize={pageSize}
        query={query}
      />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <SegmentedControl
            label="Gruppieren nach"
            options={GROUPS}
            value={groupBy}
            hrefFor={(next) =>
              drivePath({
                groupBy: next,
                sortBy,
                page: 1,
                pageSize,
                q: query,
              })
            }
          />
          <SegmentedControl
            label="Sortierung"
            options={SORTS}
            value={sortBy}
            hrefFor={(next) =>
              drivePath({
                groupBy,
                sortBy: next,
                page: 1,
                pageSize,
                q: query,
              })
            }
          />
        </div>
        <p className="text-sm tabular-nums text-muted-foreground">
          {total === 0
            ? query.trim()
              ? "Keine Treffer"
              : "Keine Dokumente"
            : `${total} Dokument${total === 1 ? "" : "e"} · Seite ${page}`}
        </p>
      </div>
    </div>
  );
}
