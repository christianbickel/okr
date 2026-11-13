import { Suspense } from "react";
import { redirect } from "next/navigation";
import { CycleForm } from "@/components/okr/cycle-form";
import { CycleList } from "@/components/okr/cycle-list";
import { isSetupComplete } from "@/lib/consolidate/config";
import { listCycles } from "@/lib/consolidate/okr-repository";

async function CyclesContent() {
  if (!(await isSetupComplete())) redirect("/setup");

  const cycles = await listCycles();

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)]">
      <section className="min-w-0 space-y-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Zyklen</h1>
          <p className="text-sm text-muted-foreground">
            CRUD über Consolidate GraphQL (`OkrCycle`).
          </p>
        </div>
        <CycleList cycles={cycles} />
      </section>

      <aside className="min-w-0 overflow-hidden rounded-xl border border-border/80 p-4 lg:sticky lg:top-20 lg:self-start">
        <h2 className="mb-3 text-sm font-medium">Neuer Zyklus</h2>
        <CycleForm compact />
      </aside>
    </div>
  );
}

export default function CyclesPage() {
  return (
    <Suspense
      fallback={<div className="h-40 animate-pulse rounded-xl bg-muted/50" />}
    >
      <CyclesContent />
    </Suspense>
  );
}
