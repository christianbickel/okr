import Link from "next/link";
import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { ObjectiveDetail } from "@/components/okr/objective-detail";
import { listActiveConsolidateUsers } from "@/lib/consolidate/client";
import { ConsolidateApiError } from "@/lib/consolidate/errors";
import { isSetupComplete } from "@/lib/consolidate/config";
import {
  getCycle,
  getObjective,
  listCycles,
  listObjectives,
  listProjectsForObjective,
} from "@/lib/consolidate/okr-repository";
import { decodeRouteId, looksLikeConsolidateId } from "@/lib/okr/paths";

async function ObjectiveDetailContent({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ newKr?: string }>;
}) {
  const rawId = (await params).id;
  const id = decodeRouteId(rawId);
  const { newKr } = await searchParams;

  if (!looksLikeConsolidateId(id)) notFound();
  if (!(await isSetupComplete())) redirect("/setup");

  let objective;
  try {
    objective = await getObjective(id, true);
  } catch (error) {
    if (
      error instanceof ConsolidateApiError &&
      /invalid format/i.test(error.message)
    ) {
      notFound();
    }
    throw error;
  }
  if (!objective) notFound();

  const [cycle, cycles, parents, users, projectResult] = await Promise.all([
    getCycle(objective.cycleId),
    listCycles(),
    listObjectives(),
    listActiveConsolidateUsers(),
    listProjectsForObjective(id),
  ]);

  if (!cycle) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-destructive">
          Zugehöriger Zyklus ({objective.cycleId}) wurde nicht gefunden.
        </p>
        <Link href="/objectives" className="text-sm underline">
          Zurück zur Übersicht
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Link
        href="/objectives"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Objectives
      </Link>
      <ObjectiveDetail
        objective={objective}
        cycle={cycle}
        cycles={cycles}
        parentObjectives={parents}
        users={users}
        projects={projectResult.projects}
        projectsUnauthorized={projectResult.unauthorized}
        initialAddingKr={newKr === "1"}
      />
    </div>
  );
}

export default function ObjectivePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ newKr?: string }>;
}) {
  return (
    <Suspense
      fallback={<div className="h-64 animate-pulse rounded-xl bg-muted/50" />}
    >
      <ObjectiveDetailContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}
