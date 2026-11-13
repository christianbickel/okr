"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { drivePath } from "@/lib/okr/drive";
import type { DriveGroupBy, DriveSortBy } from "@/lib/okr/types";

const DEBOUNCE_MS = 300;

export function DriveSearchField({
  groupBy,
  sortBy,
  pageSize,
  query,
}: {
  groupBy: DriveGroupBy;
  sortBy: DriveSortBy;
  pageSize: number;
  query: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState(query);

  useEffect(() => {
    setValue(query);
  }, [query]);

  useEffect(() => {
    const next = value.trim();
    if (next === query.trim()) return;

    const timer = window.setTimeout(() => {
      router.replace(
        drivePath({
          groupBy,
          sortBy,
          page: 1,
          pageSize,
          q: value,
        })
      );
    }, DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [value, query, groupBy, sortBy, pageSize, router]);

  return (
    <div className="relative max-w-md" role="search">
      <Search
        className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
      <Input
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key !== "Enter") return;
          event.preventDefault();
          router.replace(
            drivePath({
              groupBy,
              sortBy,
              page: 1,
              pageSize,
              q: value,
            })
          );
        }}
        placeholder="Dateiname suchen… (mehrere Begriffe)"
        aria-label="Nach Dateiname filtern, mehrere Begriffe mit Leerzeichen"
        className="pl-8"
        autoComplete="off"
      />
    </div>
  );
}
