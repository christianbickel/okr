"use client";

import { useState } from "react";
import { OkrCard } from "@/components/okr/okr-card";
import {
  DEMO_CYCLE,
  DEMO_OBJECTIVE,
} from "@/components/okr/okr-card.demo-data";
import { calculateObjectiveProgress } from "@/lib/okr/progress";
import type { CheckInInput, Objective } from "@/lib/okr/types";

export function DemoOkrSection() {
  const [objective, setObjective] = useState<Objective>(DEMO_OBJECTIVE);

  function handleCheckIn(input: CheckInInput) {
    setObjective((prev) => {
      const keyResults = prev.keyResults.map((kr) => {
        if (kr.id !== input.keyResultId) return kr;
        return {
          ...kr,
          currentValue: input.value,
          status: input.status,
          lastCheckInAt: input.checkInDate,
        };
      });

      const evaluation = calculateObjectiveProgress({
        keyResults,
        cycle: DEMO_CYCLE,
      });

      return {
        ...prev,
        keyResults,
        progress: evaluation.progress,
        status: evaluation.status,
      };
    });
  }

  return (
    <OkrCard
      objective={objective}
      cycle={DEMO_CYCLE}
      onCheckIn={handleCheckIn}
    />
  );
}
