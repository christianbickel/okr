"use client";

import { useRouter } from "next/navigation";
import { submitCheckInAction } from "@/app/(app)/objectives/actions";
import type { CycleRecord } from "@/lib/consolidate/mappers";
import type { CheckInInput, Objective } from "@/lib/okr/types";
import { OkrCard } from "./okr-card";

interface LiveOkrCardProps {
  objective: Objective;
  cycle: CycleRecord;
}

export function LiveOkrCard({ objective, cycle }: LiveOkrCardProps) {
  const router = useRouter();

  async function onCheckIn(input: CheckInInput) {
    const result = await submitCheckInAction({
      ...input,
      objectiveId: objective.id,
    });
    if (!result.ok) throw new Error(result.error);
    router.refresh();
  }

  return (
    <OkrCard objective={objective} cycle={cycle} onCheckIn={onCheckIn} />
  );
}
