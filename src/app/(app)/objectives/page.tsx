import { Suspense } from "react";
import { redirect } from "next/navigation";
import { ObjectiveForm } from "@/components/okr/objective-form";
import { ObjectiveList } from "@/components/okr/objective-list";
import { listActiveConsolidateUsers } from "@/lib/consolidate/client";
import { isSetupComplete } from "@/lib/consolidate/config";
import {
  listCycles,
  listObjectiveProjectLinks,
  listObjectives,
} from "@/lib/consolidate/okr-repository";

async function ObjectivesContent() {
  if (!(await isSetupComplete())) redirect("/setup");

  const [objectives, cycles, users, projectLinks] = await Promise.all([
    listObjectives(),
    listCycles(),
    listActiveConsolidateUsers(),
    listObjectiveProjectLinks(),
  ]);

  const activeCycle =
    cycles.find((c) => c.status === "active") ?? cycles[0] ?? undefined;

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)]">
      <section className="min-w-0 space-y-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Objectives</h1>
          <p className="text-sm text-muted-foreground">
            CRUD über Consolidate GraphQL (`OkrObjective` / `OkrKeyResult`).
            {projectLinks.unauthorized
              ? " Projekte: Leserecht fehlt — bitte mit User-Key anmelden."
              : null}
          </p>
        </div>
        <ObjectiveList
          objectives={objectives}
          cycles={cycles}
          users={users}
          projectsByObjectiveId={projectLinks.byObjectiveId}
        />
      </section>

      <aside className="min-w-0 lg:sticky lg:top-20 lg:self-start">
        <div className="overflow-hidden rounded-xl border border-border/80 p-4">
          <h2 className="mb-3 text-sm font-medium">Neues Objective</h2>
          {cycles.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Zuerst einen Zyklus unter „Zyklen“ anlegen.
            </p>
          ) : (
            <ObjectiveForm
              cycles={cycles}
              users={users}
              parentObjectives={objectives}
              defaultCycleId={activeCycle?.id}
              compact
            />
          )}
        </div>
      </aside>
    </div>
  );
}

export default function ObjectivesPage() {
  return (
    <Suspense
      fallback={<div className="h-40 animate-pulse rounded-xl bg-muted/50" />}
    >
      <ObjectivesContent />
    </Suspense>
  );
}
