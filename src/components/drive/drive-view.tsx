import {
  filterDriveDocumentsByName,
  groupDriveDocuments,
  paginateDocuments,
  sortDriveDocuments,
} from "@/lib/okr/drive";
import type { DriveDocument, DriveGroupBy, DriveSortBy } from "@/lib/okr/types";
import { DriveGrid } from "./drive-grid";
import { DrivePagination } from "./drive-pagination";
import { DriveToolbar } from "./drive-toolbar";

export function DriveView({
  documents,
  groupBy,
  sortBy,
  page,
  pageSize,
  query,
  truncated,
}: {
  documents: DriveDocument[];
  groupBy: DriveGroupBy;
  sortBy: DriveSortBy;
  page: number;
  pageSize: number;
  query: string;
  truncated?: boolean;
}) {
  const filtered = filterDriveDocumentsByName(documents, query);
  const sorted = sortDriveDocuments(filtered, sortBy);
  const paged = paginateDocuments(sorted, page, pageSize);
  const groups = groupDriveDocuments(paged.items, groupBy);

  return (
    <div className="space-y-5">
      <DriveToolbar
        groupBy={groupBy}
        sortBy={sortBy}
        total={paged.total}
        page={paged.page}
        pageSize={paged.pageSize}
        query={query}
      />
      {truncated ? (
        <p className="text-xs text-amber-700 dark:text-amber-400">
          Es wurden nur die ersten Tasks geladen. Weitere Dokumente können in
          Consolidate liegen.
        </p>
      ) : null}
      <DriveGrid groups={groups} />
      <DrivePagination
        page={paged.page}
        totalPages={paged.totalPages}
        groupBy={groupBy}
        sortBy={sortBy}
        pageSize={paged.pageSize}
        query={query}
      />
    </div>
  );
}
