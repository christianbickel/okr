import type {
  DriveDocument,
  DriveDocumentGroup,
  DriveGroupBy,
  DriveSortBy,
} from "@/lib/okr/types";

export function groupDriveDocuments(
  documents: DriveDocument[],
  groupBy: DriveGroupBy
): DriveDocumentGroup[] {
  if (groupBy === "none") {
    return [
      {
        key: "all",
        label: "Alle Dokumente",
        documents,
      },
    ];
  }

  const map = new Map<string, DriveDocumentGroup>();

  for (const doc of documents) {
    let key: string;
    let label: string;
    if (groupBy === "project") {
      key = doc.project?.id ?? "none";
      label = doc.project?.name ?? "Ohne Projekt";
    } else if (groupBy === "responsible") {
      key = doc.responsible?.id ?? "none";
      label = doc.responsible?.name ?? "Ohne Verantwortlichen";
    } else {
      key = doc.taskType?.key ?? "none";
      label = doc.taskType?.name ?? "Ohne Task-Typ";
    }

    const existing = map.get(key);
    if (existing) {
      existing.documents.push(doc);
    } else {
      map.set(key, { key, label, documents: [doc] });
    }
  }

  return [...map.values()].sort((a, b) => {
    if (a.key === "none") return 1;
    if (b.key === "none") return -1;
    return a.label.localeCompare(b.label, "de");
  });
}

export function paginateDocuments<T>(
  items: T[],
  page: number,
  pageSize: number
): {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
} {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1);
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    page: safePage,
    pageSize,
    total,
    totalPages,
  };
}

export function parseDriveGroupBy(raw: string | undefined): DriveGroupBy {
  if (raw === "project" || raw === "responsible" || raw === "taskType") {
    return raw;
  }
  return "none";
}

export function parseDriveSortBy(raw: string | undefined): DriveSortBy {
  if (raw === "modified" || raw === "name") return raw;
  return "created";
}

export function filterDriveDocumentsByName(
  documents: DriveDocument[],
  query: string
): DriveDocument[] {
  const terms = query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
  if (terms.length === 0) return documents;
  return documents.filter((doc) => {
    const name = doc.name.toLowerCase();
    return terms.every((term) => name.includes(term));
  });
}

function timestampForSort(doc: DriveDocument, sortBy: DriveSortBy): number {
  const raw =
    sortBy === "modified"
      ? doc.modifiedAt ?? doc.createdAt
      : doc.createdAt ?? doc.modifiedAt;
  return raw ? Date.parse(raw) : 0;
}

/** created/modified descending; name ascending (A–Z). */
export function sortDriveDocuments(
  documents: DriveDocument[],
  sortBy: DriveSortBy
): DriveDocument[] {
  if (sortBy === "name") {
    return [...documents].sort((a, b) =>
      a.name.localeCompare(b.name, "de", { sensitivity: "base" })
    );
  }
  return [...documents].sort(
    (a, b) => timestampForSort(b, sortBy) - timestampForSort(a, sortBy)
  );
}

export function drivePath(options: {
  groupBy: DriveGroupBy;
  sortBy: DriveSortBy;
  page?: number;
  pageSize: number;
  q?: string;
}): string {
  const params = new URLSearchParams();
  params.set("group", options.groupBy);
  params.set("sort", options.sortBy);
  params.set("page", String(options.page ?? 1));
  params.set("pageSize", String(options.pageSize));
  const q = options.q?.trim();
  if (q) params.set("q", q);
  return `/drive?${params.toString()}`;
}
