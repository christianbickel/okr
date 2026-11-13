import { Suspense } from "react";
import { redirect } from "next/navigation";
import { DriveView } from "@/components/drive/drive-view";
import { getAuthSession } from "@/lib/auth/session";
import { isSetupComplete } from "@/lib/consolidate/config";
import { listDriveDocuments } from "@/lib/consolidate/drive-repository";
import { ConsolidateApiError } from "@/lib/consolidate/errors";
import { parseDriveGroupBy, parseDriveSortBy } from "@/lib/okr/drive";

async function DriveContent({
  searchParams,
}: {
  searchParams: Promise<{
    group?: string;
    sort?: string;
    page?: string;
    pageSize?: string;
    q?: string;
  }>;
}) {
  if (!(await isSetupComplete())) redirect("/setup");

  const session = await getAuthSession();
  if (!session) {
    redirect("/login?next=/drive");
  }

  const params = await searchParams;
  const groupBy = parseDriveGroupBy(params.group);
  const sortBy = parseDriveSortBy(params.sort);
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const pageSizeRaw = Number.parseInt(params.pageSize ?? "24", 10) || 24;
  const pageSize = Math.min(48, Math.max(12, pageSizeRaw));
  const query = (params.q ?? "").trim();

  let documents;
  let truncated = false;
  try {
    const result = await listDriveDocuments();
    documents = result.documents;
    truncated = result.truncated;
  } catch (error) {
    const message =
      error instanceof ConsolidateApiError
        ? error.message
        : "Dokumente konnten nicht geladen werden.";
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold tracking-tight">Drive</h1>
        <p className="text-sm text-destructive">{message}</p>
        <p className="text-sm text-muted-foreground">
          Prüfe, ob dein User Leserechte auf Tasks und Anhänge in Consolidate
          hat.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Drive</h1>
        <p className="text-sm text-muted-foreground">
          Dokumente aus Consolidate-Tasks — Klick öffnet die Ansicht in
          Consolidate. Angemeldet als {session.user.displayName}.
        </p>
      </div>
      <DriveView
        documents={documents}
        groupBy={groupBy}
        sortBy={sortBy}
        page={page}
        pageSize={pageSize}
        query={query}
        truncated={truncated}
      />
    </div>
  );
}

export default function DrivePage({
  searchParams,
}: {
  searchParams: Promise<{
    group?: string;
    sort?: string;
    page?: string;
    pageSize?: string;
    q?: string;
  }>;
}) {
  return (
    <Suspense
      fallback={<div className="h-64 animate-pulse rounded-xl bg-muted/50" />}
    >
      <DriveContent searchParams={searchParams} />
    </Suspense>
  );
}
