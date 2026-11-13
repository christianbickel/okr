import Link from "next/link";
import { LiveOkrCard } from "@/components/okr/live-okr-card";
import {
  getCycle,
  getObjective,
  listObjectives,
} from "@/lib/consolidate/okr-repository";

export async function LiveOkrSection() {
  const listed = await listObjectives({ take: 8 });
  if (listed.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Noch keine Objectives.{" "}
        <Link href="/objectives" className="underline">
          Jetzt anlegen
        </Link>
        .
      </p>
    );
  }

  const cards = (
    await Promise.all(
      listed.map(async (item) => {
        const [objective, cycle] = await Promise.all([
          getObjective(item.id, true),
          getCycle(item.cycleId),
        ]);
        if (!objective || !cycle) return null;
        return { objective, cycle };
      })
    )
  ).filter((x): x is NonNullable<typeof x> => x != null);

  return (
    <div className="grid gap-4">
      {cards.map(({ objective, cycle }) => (
        <LiveOkrCard
          key={objective.id}
          objective={{
            ...objective,
            keyResults: objective.keyResults ?? [],
          }}
          cycle={cycle}
        />
      ))}
    </div>
  );
}
