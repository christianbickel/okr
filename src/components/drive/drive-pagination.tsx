import Link from "next/link";
import { drivePath } from "@/lib/okr/drive";
import type { DriveGroupBy, DriveSortBy } from "@/lib/okr/types";
import { cn } from "@/lib/utils";

export function DrivePagination({
  page,
  totalPages,
  groupBy,
  sortBy,
  pageSize,
  query,
}: {
  page: number;
  totalPages: number;
  groupBy: DriveGroupBy;
  sortBy: DriveSortBy;
  pageSize: number;
  query: string;
}) {
  if (totalPages <= 1) return null;

  const hrefFor = (p: number) =>
    drivePath({ groupBy, sortBy, page: p, pageSize, q: query });

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2
  );

  const withEllipsis: Array<number | "…"> = [];
  for (let i = 0; i < pages.length; i++) {
    const current = pages[i]!;
    const prev = pages[i - 1];
    if (prev && current - prev > 1) withEllipsis.push("…");
    withEllipsis.push(current);
  }

  return (
    <nav
      aria-label="Seiten"
      className="flex flex-wrap items-center justify-center gap-1.5 pt-2"
    >
      <Link
        href={hrefFor(Math.max(1, page - 1))}
        aria-disabled={page <= 1}
        className={cn(
          "rounded-md border border-border/80 px-3 py-1.5 text-sm transition-colors duration-150 ease-[cubic-bezier(0.2,0,0,1)]",
          page <= 1
            ? "pointer-events-none opacity-40"
            : "hover:bg-muted"
        )}
      >
        Zurück
      </Link>
      {withEllipsis.map((item, index) =>
        item === "…" ? (
          <span
            key={`e-${index}`}
            className="px-1 text-sm text-muted-foreground"
          >
            …
          </span>
        ) : (
          <Link
            key={item}
            href={hrefFor(item)}
            aria-current={item === page ? "page" : undefined}
            className={cn(
              "min-w-9 rounded-md px-2.5 py-1.5 text-center text-sm tabular-nums transition-colors duration-150 ease-[cubic-bezier(0.2,0,0,1)]",
              item === page
                ? "bg-foreground text-background"
                : "border border-border/80 hover:bg-muted"
            )}
          >
            {item}
          </Link>
        )
      )}
      <Link
        href={hrefFor(Math.min(totalPages, page + 1))}
        aria-disabled={page >= totalPages}
        className={cn(
          "rounded-md border border-border/80 px-3 py-1.5 text-sm transition-colors duration-150 ease-[cubic-bezier(0.2,0,0,1)]",
          page >= totalPages
            ? "pointer-events-none opacity-40"
            : "hover:bg-muted"
        )}
      >
        Weiter
      </Link>
    </nav>
  );
}
