import { describe, expect, it } from "vitest";
import {
  buildAlignmentForest,
  collectAlignmentWithRelated,
  countAlignmentNodes,
  type AlignmentObjective,
} from "./alignment";

function obj(
  partial: Partial<AlignmentObjective> & Pick<AlignmentObjective, "id" | "title">
): AlignmentObjective {
  return {
    level: "company",
    cycleId: "c1",
    ownerName: "A",
    status: "on_track",
    progress: 0,
    keyResults: [],
    ...partial,
  };
}

describe("buildAlignmentForest", () => {
  it("nests children under parents and keeps key results", () => {
    const forest = buildAlignmentForest([
      obj({
        id: "1",
        title: "Company",
        level: "company",
        keyResults: [
          {
            id: "kr1",
            title: "KR A",
            ownerName: "A",
            metricType: "number",
            startValue: 0,
            targetValue: 10,
            currentValue: 4,
            weight: 1,
            status: "on_track",
          },
        ],
      }),
      obj({
        id: "2",
        title: "Team",
        level: "team",
        parentObjectiveId: "1",
      }),
    ]);
    expect(forest).toHaveLength(1);
    expect(forest[0].keyResults).toHaveLength(1);
    expect(forest[0].children).toHaveLength(1);
    expect(countAlignmentNodes(forest)).toEqual({
      objectives: 2,
      keyResults: 1,
    });
  });

  it("treats missing parents as roots", () => {
    const forest = buildAlignmentForest([
      obj({
        id: "2",
        title: "Orphan",
        level: "team",
        parentObjectiveId: "missing",
      }),
    ]);
    expect(forest).toHaveLength(1);
    expect(forest[0].id).toBe("2");
  });
});

describe("collectAlignmentWithRelated", () => {
  it("includes parents and children outside the focus cycle", () => {
    const all = [
      obj({ id: "p", title: "Parent", cycleId: "c1", level: "company" }),
      obj({
        id: "f",
        title: "Focus",
        cycleId: "c2",
        level: "team",
        parentObjectiveId: "p",
      }),
      obj({
        id: "c",
        title: "Child",
        cycleId: "c3",
        level: "individual",
        parentObjectiveId: "f",
      }),
      obj({ id: "x", title: "Unrelated", cycleId: "c9", level: "company" }),
    ];
    const scoped = collectAlignmentWithRelated(all, "c2");
    expect(scoped.map((o) => o.id).sort()).toEqual(["c", "f", "p"]);

    const forest = buildAlignmentForest(scoped, "c2");
    expect(forest[0].id).toBe("p");
    expect(forest[0].outOfCycle).toBe(true);
    expect(forest[0].children[0].outOfCycle).toBe(false);
    expect(forest[0].children[0].children[0].outOfCycle).toBe(true);
  });
});
