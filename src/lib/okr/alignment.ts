import type {
  MetricType,
  ObjectiveLevel,
  ObjectiveLifecycleStatus,
  TrafficStatus,
} from "./types";

export interface AlignmentKeyResult {
  id: string;
  title: string;
  ownerName: string;
  metricType: MetricType;
  unit?: string;
  startValue: number;
  targetValue: number;
  currentValue: number;
  weight: number;
  status: TrafficStatus;
}

export interface AlignmentObjective {
  id: string;
  title: string;
  level: ObjectiveLevel;
  cycleId: string;
  parentObjectiveId?: string;
  ownerName: string;
  teamName?: string;
  status: ObjectiveLifecycleStatus;
  progress: number;
  keyResults: AlignmentKeyResult[];
}

export interface AlignmentNode extends AlignmentObjective {
  children: AlignmentNode[];
  /** True when included only as parent/child context outside the focus cycle. */
  outOfCycle?: boolean;
}

/**
 * For a focus cycle: keep in-cycle objectives plus all ancestors and descendants
 * linked via `parentObjectiveId`, even if they live in another cycle.
 */
export function collectAlignmentWithRelated(
  objectives: AlignmentObjective[],
  focusCycleId: string | "all"
): AlignmentObjective[] {
  if (focusCycleId === "all") return objectives;

  const byId = new Map(objectives.map((o) => [o.id, o]));
  const childrenByParent = new Map<string, string[]>();
  for (const o of objectives) {
    if (!o.parentObjectiveId) continue;
    const list = childrenByParent.get(o.parentObjectiveId) ?? [];
    list.push(o.id);
    childrenByParent.set(o.parentObjectiveId, list);
  }

  const include = new Set<string>();
  for (const o of objectives) {
    if (o.cycleId === focusCycleId) include.add(o.id);
  }

  // Walk up to all parents
  for (const id of [...include]) {
    let cur = byId.get(id)?.parentObjectiveId;
    while (cur && byId.has(cur) && !include.has(cur)) {
      include.add(cur);
      cur = byId.get(cur)?.parentObjectiveId;
    }
  }

  // Walk down to all descendants
  const queue = [...include];
  while (queue.length > 0) {
    const id = queue.pop()!;
    for (const childId of childrenByParent.get(id) ?? []) {
      if (!include.has(childId)) {
        include.add(childId);
        queue.push(childId);
      }
    }
  }

  return objectives.filter((o) => include.has(o.id));
}

/**
 * Build a forest from flat objectives via `parentObjectiveId`.
 * Missing parents → node becomes a root (orphan).
 * Cycles are broken by treating the back-edge as no parent.
 */
export function buildAlignmentForest(
  objectives: AlignmentObjective[],
  focusCycleId: string | "all" = "all"
): AlignmentNode[] {
  const byId = new Map<string, AlignmentNode>();
  for (const o of objectives) {
    byId.set(o.id, {
      ...o,
      outOfCycle:
        focusCycleId !== "all" ? o.cycleId !== focusCycleId : false,
      keyResults: [...o.keyResults].sort((a, b) =>
        a.title.localeCompare(b.title, "de", { sensitivity: "base" })
      ),
      children: [],
    });
  }

  const roots: AlignmentNode[] = [];

  function parentIdOf(id: string): string | undefined {
    const node = byId.get(id);
    const parentId = node?.parentObjectiveId;
    if (!parentId || !byId.has(parentId)) return undefined;
    return parentId;
  }

  function wouldCreateCycle(childId: string, parentId: string): boolean {
    let cur: string | undefined = parentId;
    const seen = new Set<string>();
    while (cur) {
      if (cur === childId) return true;
      if (seen.has(cur)) return true;
      seen.add(cur);
      cur = parentIdOf(cur);
    }
    return false;
  }

  for (const node of byId.values()) {
    const parentId = node.parentObjectiveId;
    if (
      parentId &&
      byId.has(parentId) &&
      !wouldCreateCycle(node.id, parentId)
    ) {
      byId.get(parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  const levelOrder: Record<ObjectiveLevel, number> = {
    company: 0,
    team: 1,
    individual: 2,
  };

  function sortNodes(nodes: AlignmentNode[]) {
    nodes.sort((a, b) => {
      const lv = levelOrder[a.level] - levelOrder[b.level];
      if (lv !== 0) return lv;
      return a.title.localeCompare(b.title, "de", { sensitivity: "base" });
    });
    for (const n of nodes) sortNodes(n.children);
  }

  sortNodes(roots);
  return roots;
}

export function countAlignmentNodes(nodes: AlignmentNode[]): {
  objectives: number;
  keyResults: number;
} {
  return nodes.reduce(
    (sum, n) => {
      const nested = countAlignmentNodes(n.children);
      return {
        objectives: sum.objectives + 1 + nested.objectives,
        keyResults: sum.keyResults + n.keyResults.length + nested.keyResults,
      };
    },
    { objectives: 0, keyResults: 0 }
  );
}
