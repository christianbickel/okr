import "server-only";

import type {
  CheckInInput,
  CycleStatus,
  CycleType,
  KeyResult,
  LinkedProject,
  MetricType,
  ObjectiveLevel,
  ObjectiveLifecycleStatus,
  TrafficStatus,
} from "@/lib/okr/types";
import { calculateObjectiveProgress } from "@/lib/okr/progress";
import { consolidateGraphql } from "./client";
import { readInstanceConfig } from "./config";
import { ConsolidateApiError } from "./errors";
import { consolidateEntryUrl } from "./urls";
import {
  cycleStatusId,
  cycleTypeId,
  metricTypeId,
  objectiveLevelId,
  objectiveStatusId,
  trafficStatusId,
} from "./enums";
import {
  CHECK_IN_VALUES,
  CYCLE_VALUES,
  KEY_RESULT_VALUES,
  OBJECTIVE_VALUES,
} from "./fragments";
import {
  mapCheckIn,
  mapCycle,
  mapKeyResult,
  mapObjective,
  type CheckInRecord,
  type CycleRecord,
  type KeyResultRecord,
  type ObjectiveRecord,
} from "./mappers";
import { defaultSecurityRules } from "./security";

function richText(html?: string) {
  if (!html?.trim()) return undefined;
  return { htmlText: html };
}

export async function listCycles(params?: {
  search?: string;
  take?: number;
}): Promise<CycleRecord[]> {
  const data = await consolidateGraphql<{
    dataEntries_OkrCycle: {
      items: Array<{
        id: string;
        changeVector?: string;
        values: Parameters<typeof mapCycle>[0]["values"];
      }>;
    };
  }>(
    `query ListCycles($search: String, $take: Int!) {
      dataEntries_OkrCycle(
        searchString: $search
        take: $take
        includeInactive: false
      ) {
        items {
          id
          changeVector
          values { ${CYCLE_VALUES} }
        }
      }
    }`,
    { search: params?.search || null, take: params?.take ?? 50 }
  );

  return (data.dataEntries_OkrCycle.items ?? []).map(mapCycle);
}

export async function getCycle(id: string): Promise<CycleRecord | null> {
  const data = await consolidateGraphql<{
    dataEntry_OkrCycle: {
      id: string;
      changeVector?: string;
      values: Parameters<typeof mapCycle>[0]["values"];
    } | null;
  }>(
    `query GetCycle($id: ID!) {
      dataEntry_OkrCycle(id: $id) {
        id
        changeVector
        values { ${CYCLE_VALUES} }
      }
    }`,
    { id }
  );

  return data.dataEntry_OkrCycle ? mapCycle(data.dataEntry_OkrCycle) : null;
}

export interface CreateCycleInput {
  title: string;
  descriptionHtml?: string;
  startDate: string;
  endDate: string;
  cycleType: CycleType;
  status: CycleStatus;
}

export async function createCycle(input: CreateCycleInput): Promise<CycleRecord> {
  const securityRules = await defaultSecurityRules();
  const data = await consolidateGraphql<{
    createOkrCycle: {
      okrCycle: {
        id: string;
        changeVector?: string;
        values: Parameters<typeof mapCycle>[0]["values"];
      };
    };
  }>(
    `mutation CreateCycle($input: CreateOkrCycleInput!) {
      createOkrCycle(input: $input) {
        okrCycle {
          id
          changeVector
          values { ${CYCLE_VALUES} }
        }
      }
    }`,
    {
      input: {
        dataEntry: {
          title: input.title,
          description: richText(input.descriptionHtml),
          startDate: input.startDate,
          endDate: input.endDate,
          cycleType: cycleTypeId(input.cycleType),
          status: cycleStatusId(input.status),
        },
        securityRules,
      },
    }
  );

  return mapCycle(data.createOkrCycle.okrCycle);
}

export async function updateCycle(
  id: string,
  patch: Partial<CreateCycleInput>,
  changeVector?: string
): Promise<CycleRecord> {
  const dataEntry: Record<string, unknown> = {};
  if (patch.title !== undefined) dataEntry.title = patch.title;
  if (patch.descriptionHtml !== undefined) {
    dataEntry.description = richText(patch.descriptionHtml) ?? { htmlText: "" };
  }
  if (patch.startDate !== undefined) dataEntry.startDate = patch.startDate;
  if (patch.endDate !== undefined) dataEntry.endDate = patch.endDate;
  if (patch.cycleType !== undefined) dataEntry.cycleType = cycleTypeId(patch.cycleType);
  if (patch.status !== undefined) dataEntry.status = cycleStatusId(patch.status);

  const data = await consolidateGraphql<{
    updateOkrCycle: {
      okrCycle: {
        id: string;
        changeVector?: string;
        values: Parameters<typeof mapCycle>[0]["values"];
      };
    };
  }>(
    `mutation UpdateCycle($input: UpdateOkrCycleInput!) {
      updateOkrCycle(input: $input) {
        okrCycle {
          id
          changeVector
          values { ${CYCLE_VALUES} }
        }
      }
    }`,
    {
      input: {
        id,
        changeVector: changeVector ?? null,
        dataEntry,
      },
    }
  );

  return mapCycle(data.updateOkrCycle.okrCycle);
}

export async function deleteEntries(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  await consolidateGraphql(
    `mutation Trash($input: MoveToTrashInput!) {
      moveToTrash(input: $input) {
        errors { __typename ... on Error { message } }
      }
    }`,
    { input: { ids } }
  );
}

export async function listObjectives(params?: {
  cycleId?: string;
  search?: string;
  take?: number;
}): Promise<ObjectiveRecord[]> {
  const data = await consolidateGraphql<{
    dataEntries_OkrObjective: {
      items: Array<{
        id: string;
        changeVector?: string;
        values: Parameters<typeof mapObjective>[0]["values"];
      }>;
    };
  }>(
    `query ListObjectives($search: String, $take: Int!) {
      dataEntries_OkrObjective(
        searchString: $search
        take: $take
        includeInactive: false
      ) {
        items {
          id
          changeVector
          values { ${OBJECTIVE_VALUES} }
        }
      }
    }`,
    { search: params?.search || null, take: params?.take ?? 100 }
  );

  let items = (data.dataEntries_OkrObjective.items ?? []).map(mapObjective);
  if (params?.cycleId) {
    items = items.filter((o) => o.cycleId === params.cycleId);
  }
  return items;
}

export async function getObjective(
  id: string,
  withKeyResults = true
): Promise<ObjectiveRecord | null> {
  const data = await consolidateGraphql<{
    dataEntry_OkrObjective: {
      id: string;
      changeVector?: string;
      values: Parameters<typeof mapObjective>[0]["values"];
    } | null;
  }>(
    `query GetObjective($id: ID!) {
      dataEntry_OkrObjective(id: $id) {
        id
        changeVector
        values { ${OBJECTIVE_VALUES} }
      }
    }`,
    { id }
  );

  if (!data.dataEntry_OkrObjective) return null;
  const objective = mapObjective(data.dataEntry_OkrObjective);
  if (withKeyResults) {
    objective.keyResults = await listKeyResults({ objectiveId: id });
  }
  return objective;
}

export interface CreateObjectiveInput {
  title: string;
  descriptionHtml?: string;
  level: ObjectiveLevel;
  cycleId: string;
  status?: ObjectiveLifecycleStatus;
  parentObjectiveId?: string;
  ownerId: string;
  teamId?: string;
  teamName?: string;
  progress?: number;
  weight?: number;
}

export async function createObjective(
  input: CreateObjectiveInput
): Promise<ObjectiveRecord> {
  const securityRules = await defaultSecurityRules();
  const data = await consolidateGraphql<{
    createOkrObjective: {
      okrObjective: {
        id: string;
        changeVector?: string;
        values: Parameters<typeof mapObjective>[0]["values"];
      };
    };
  }>(
    `mutation CreateObjective($input: CreateOkrObjectiveInput!) {
      createOkrObjective(input: $input) {
        okrObjective {
          id
          changeVector
          values { ${OBJECTIVE_VALUES} }
        }
      }
    }`,
    {
      input: {
        dataEntry: {
          title: input.title,
          description: richText(input.descriptionHtml),
          level: objectiveLevelId(input.level),
          cycleId: input.cycleId,
          status: objectiveStatusId(input.status ?? "draft"),
          parentObjectiveId: input.parentObjectiveId || null,
          owner: input.ownerId,
          teamId: input.teamId || null,
          teamName: input.teamName || null,
          progress: input.progress ?? 0,
          weight: input.weight ?? 1,
        },
        securityRules,
      },
    }
  );

  return mapObjective(data.createOkrObjective.okrObjective);
}

export async function updateObjective(
  id: string,
  patch: Partial<CreateObjectiveInput>,
  changeVector?: string
): Promise<ObjectiveRecord> {
  const dataEntry: Record<string, unknown> = {};
  if (patch.title !== undefined) dataEntry.title = patch.title;
  if (patch.descriptionHtml !== undefined) {
    dataEntry.description = richText(patch.descriptionHtml) ?? { htmlText: "" };
  }
  if (patch.level !== undefined) dataEntry.level = objectiveLevelId(patch.level);
  if (patch.cycleId !== undefined) dataEntry.cycleId = patch.cycleId;
  if (patch.status !== undefined) {
    dataEntry.status = objectiveStatusId(patch.status);
  }
  if (patch.parentObjectiveId !== undefined) {
    dataEntry.parentObjectiveId = patch.parentObjectiveId || null;
  }
  if (patch.ownerId !== undefined) dataEntry.owner = patch.ownerId;
  if (patch.teamId !== undefined) dataEntry.teamId = patch.teamId || null;
  if (patch.teamName !== undefined) dataEntry.teamName = patch.teamName || null;
  if (patch.progress !== undefined) dataEntry.progress = patch.progress;
  if (patch.weight !== undefined) dataEntry.weight = patch.weight;

  const data = await consolidateGraphql<{
    updateOkrObjective: {
      okrObjective: {
        id: string;
        changeVector?: string;
        values: Parameters<typeof mapObjective>[0]["values"];
      };
    };
  }>(
    `mutation UpdateObjective($input: UpdateOkrObjectiveInput!) {
      updateOkrObjective(input: $input) {
        okrObjective {
          id
          changeVector
          values { ${OBJECTIVE_VALUES} }
        }
      }
    }`,
    {
      input: {
        id,
        changeVector: changeVector ?? null,
        dataEntry,
      },
    }
  );

  return mapObjective(data.updateOkrObjective.okrObjective);
}

export async function listKeyResults(params?: {
  objectiveId?: string;
  take?: number;
}): Promise<KeyResultRecord[]> {
  const data = await consolidateGraphql<{
    dataEntries_OkrKeyResult: {
      items: Array<{
        id: string;
        changeVector?: string;
        values: Parameters<typeof mapKeyResult>[0]["values"];
      }>;
    };
  }>(
    `query ListKeyResults($take: Int!) {
      dataEntries_OkrKeyResult(take: $take, includeInactive: false) {
        items {
          id
          changeVector
          values { ${KEY_RESULT_VALUES} }
        }
      }
    }`,
    { take: params?.take ?? 200 }
  );

  let items = (data.dataEntries_OkrKeyResult.items ?? []).map(mapKeyResult);
  if (params?.objectiveId) {
    items = items.filter((kr) => kr.objectiveId === params.objectiveId);
  }
  return items;
}

export interface CreateKeyResultInput {
  title: string;
  descriptionHtml?: string;
  objectiveId: string;
  ownerId: string;
  metricType: MetricType;
  unit?: string;
  status?: TrafficStatus;
  startValue: number;
  targetValue: number;
  currentValue?: number;
  weight?: number;
  dueDate?: string;
}

export async function createKeyResult(
  input: CreateKeyResultInput
): Promise<KeyResultRecord> {
  const securityRules = await defaultSecurityRules();
  const data = await consolidateGraphql<{
    createOkrKeyResult: {
      okrKeyResult: {
        id: string;
        changeVector?: string;
        values: Parameters<typeof mapKeyResult>[0]["values"];
      };
    };
  }>(
    `mutation CreateKeyResult($input: CreateOkrKeyResultInput!) {
      createOkrKeyResult(input: $input) {
        okrKeyResult {
          id
          changeVector
          values { ${KEY_RESULT_VALUES} }
        }
      }
    }`,
    {
      input: {
        dataEntry: {
          title: input.title,
          description: richText(input.descriptionHtml),
          objectiveId: input.objectiveId,
          owner: input.ownerId,
          metricType: metricTypeId(input.metricType),
          unit: input.unit || null,
          status: trafficStatusId(input.status ?? "on_track"),
          startValue: input.startValue,
          targetValue: input.targetValue,
          currentValue: input.currentValue ?? input.startValue,
          weight: input.weight ?? 1,
          dueDate: input.dueDate || null,
        },
        securityRules,
      },
    }
  );

  const kr = mapKeyResult(data.createOkrKeyResult.okrKeyResult);
  await recalculateObjectiveProgress(input.objectiveId);
  return kr;
}

export async function updateKeyResult(
  id: string,
  patch: Partial<CreateKeyResultInput>,
  changeVector?: string
): Promise<KeyResultRecord> {
  const existing = await consolidateGraphql<{
    dataEntry_OkrKeyResult: {
      id: string;
      values: { objectiveId?: string | null };
    } | null;
  }>(
    `query($id: ID!) {
      dataEntry_OkrKeyResult(id: $id) { id values { objectiveId } }
    }`,
    { id }
  );

  const dataEntry: Record<string, unknown> = {};
  if (patch.title !== undefined) dataEntry.title = patch.title;
  if (patch.descriptionHtml !== undefined) {
    dataEntry.description = richText(patch.descriptionHtml) ?? { htmlText: "" };
  }
  if (patch.objectiveId !== undefined) dataEntry.objectiveId = patch.objectiveId;
  if (patch.ownerId !== undefined) dataEntry.owner = patch.ownerId;
  if (patch.metricType !== undefined) {
    dataEntry.metricType = metricTypeId(patch.metricType);
  }
  if (patch.unit !== undefined) dataEntry.unit = patch.unit || null;
  if (patch.status !== undefined) dataEntry.status = trafficStatusId(patch.status);
  if (patch.startValue !== undefined) dataEntry.startValue = patch.startValue;
  if (patch.targetValue !== undefined) dataEntry.targetValue = patch.targetValue;
  if (patch.currentValue !== undefined) {
    dataEntry.currentValue = patch.currentValue;
  }
  if (patch.weight !== undefined) dataEntry.weight = patch.weight;
  if (patch.dueDate !== undefined) dataEntry.dueDate = patch.dueDate || null;

  const data = await consolidateGraphql<{
    updateOkrKeyResult: {
      okrKeyResult: {
        id: string;
        changeVector?: string;
        values: Parameters<typeof mapKeyResult>[0]["values"];
      };
    };
  }>(
    `mutation UpdateKeyResult($input: UpdateOkrKeyResultInput!) {
      updateOkrKeyResult(input: $input) {
        okrKeyResult {
          id
          changeVector
          values { ${KEY_RESULT_VALUES} }
        }
      }
    }`,
    {
      input: {
        id,
        changeVector: changeVector ?? null,
        dataEntry,
      },
    }
  );

  const kr = mapKeyResult(data.updateOkrKeyResult.okrKeyResult);
  const objectiveId =
    kr.objectiveId || existing.dataEntry_OkrKeyResult?.values.objectiveId;
  if (objectiveId) await recalculateObjectiveProgress(objectiveId);
  return kr;
}

export async function listCheckIns(params?: {
  keyResultId?: string;
  take?: number;
}): Promise<CheckInRecord[]> {
  const data = await consolidateGraphql<{
    dataEntries_OkrCheckIn: {
      items: Array<{
        id: string;
        changeVector?: string;
        values: Parameters<typeof mapCheckIn>[0]["values"];
      }>;
    };
  }>(
    `query ListCheckIns($take: Int!) {
      dataEntries_OkrCheckIn(take: $take, includeInactive: false) {
        items {
          id
          changeVector
          values { ${CHECK_IN_VALUES} }
        }
      }
    }`,
    { take: params?.take ?? 200 }
  );

  let items = (data.dataEntries_OkrCheckIn.items ?? []).map(mapCheckIn);
  if (params?.keyResultId) {
    items = items.filter((c) => c.keyResultId === params.keyResultId);
  }
  return items.sort((a, b) => b.checkInDate.localeCompare(a.checkInDate));
}

export async function createCheckIn(
  input: CheckInInput & { authorId?: string }
): Promise<CheckInRecord> {
  let authorId = input.authorId;
  if (!authorId) {
    const kr = await consolidateGraphql<{
      dataEntry_OkrKeyResult: {
        values: {
          owner?: { id?: string | null } | null;
          objectiveId?: string | null;
        };
      } | null;
    }>(
      `query($id: ID!) {
        dataEntry_OkrKeyResult(id: $id) {
          values {
            owner { ... on User { id } }
            objectiveId
          }
        }
      }`,
      { id: input.keyResultId }
    );
    authorId = kr.dataEntry_OkrKeyResult?.values.owner?.id ?? undefined;
  }
  if (!authorId) {
    throw new Error(
      "Check-in braucht einen menschlichen Autor (Owner des Key Results)."
    );
  }

  const checkInDate =
    input.checkInDate ?? new Date().toISOString().slice(0, 10);
  const securityRules = await defaultSecurityRules();

  const data = await consolidateGraphql<{
    createOkrCheckIn: {
      okrCheckIn: {
        id: string;
        changeVector?: string;
        values: Parameters<typeof mapCheckIn>[0]["values"];
      };
    };
  }>(
    `mutation CreateCheckIn($input: CreateOkrCheckInInput!) {
      createOkrCheckIn(input: $input) {
        okrCheckIn {
          id
          changeVector
          values { ${CHECK_IN_VALUES} }
        }
      }
    }`,
    {
      input: {
        dataEntry: {
          title: `Check-in ${checkInDate}`,
          keyResultId: input.keyResultId,
          author: authorId,
          value: input.value,
          status: trafficStatusId(input.status),
          checkInDate,
          comment: input.comment || null,
        },
        securityRules,
      },
    }
  );

  await updateKeyResult(input.keyResultId, {
    currentValue: input.value,
    status: input.status,
  });

  return mapCheckIn(data.createOkrCheckIn.okrCheckIn);
}

export async function recalculateObjectiveProgress(
  objectiveId: string
): Promise<ObjectiveRecord | null> {
  const objective = await getObjective(objectiveId, true);
  if (!objective) return null;

  const cycle = await getCycle(objective.cycleId);
  if (!cycle) return objective;

  const evaluation = calculateObjectiveProgress({
    keyResults: (objective.keyResults ?? []) as KeyResult[],
    cycle,
  });

  const status: ObjectiveLifecycleStatus =
    objective.status === "draft" || objective.status === "completed"
      ? objective.status
      : evaluation.status;

  return updateObjective(
    objectiveId,
    {
      progress: evaluation.progress,
      status,
    },
    objective.changeVector
  );
}

function addProjectLink(
  map: Map<string, LinkedProject[]>,
  objectiveId: string,
  project: LinkedProject
) {
  const list = map.get(objectiveId) ?? [];
  if (!list.some((p) => p.id === project.id)) {
    list.push(project);
    map.set(objectiveId, list);
  }
}

function sortProjectMap(
  map: Map<string, LinkedProject[]>
): Record<string, LinkedProject[]> {
  const out: Record<string, LinkedProject[]> = {};
  for (const [objectiveId, projects] of map) {
    out[objectiveId] = [...projects].sort((a, b) =>
      a.name.localeCompare(b.name, "de", { sensitivity: "base" })
    );
  }
  return out;
}

/**
 * Projects linked to Objectives via Project field `Ziele`
 * (and reverse `associations` when available).
 */
export async function listObjectiveProjectLinks(): Promise<{
  byObjectiveId: Record<string, LinkedProject[]>;
  unauthorized: boolean;
}> {
  const map = new Map<string, LinkedProject[]>();
  let unauthorized = false;
  const apiUrl = (await readInstanceConfig())?.apiUrl;

  function toLinkedProject(input: {
    id: string;
    name?: string | null;
    displayName?: string | null;
    databaseId?: string | null;
  }): LinkedProject {
    return {
      id: input.id,
      name:
        input.name?.trim() ||
        input.displayName?.trim() ||
        input.databaseId ||
        input.id,
      databaseId: input.databaseId ?? undefined,
      url: apiUrl ? consolidateEntryUrl(apiUrl, input.id) : undefined,
    };
  }

  try {
    const data = await consolidateGraphql<{
      dataEntries_Project: {
        items: Array<{
          id: string;
          displayName?: string | null;
          databaseId?: string | null;
          values: {
            name?: string | null;
            Ziele?: Array<{ id: string; displayName?: string | null }> | null;
          };
        }>;
      };
    }>(
      `query ListProjectsWithZiele($take: Int!) {
        dataEntries_Project(take: $take, includeInactive: false) {
          items {
            id
            displayName
            databaseId
            values {
              name
              Ziele { id displayName }
            }
          }
        }
      }`,
      { take: 200 }
    );

    for (const project of data.dataEntries_Project.items ?? []) {
      const linked = toLinkedProject({
        id: project.id,
        name: project.values.name,
        displayName: project.displayName,
        databaseId: project.databaseId,
      });
      for (const objective of project.values.Ziele ?? []) {
        if (objective?.id) addProjectLink(map, objective.id, linked);
      }
    }
  } catch (error) {
    if (
      error instanceof ConsolidateApiError &&
      (/not authorized|unauthorized/i.test(error.message) ||
        error.errors?.some((e) => e.extensions?.code === "Unauthorized"))
    ) {
      unauthorized = true;
    } else {
      throw error;
    }
  }

  try {
    const data = await consolidateGraphql<{
      dataEntries_OkrObjective: {
        items: Array<{
          id: string;
          associations: {
            items: Array<{
              roles: Array<{
                __typename?: string;
                key?: string | null;
                dataCollection?: string | null;
              } | null> | null;
              entity: {
                __typename?: string;
                id?: string;
                displayName?: string | null;
                databaseId?: string | null;
                values?: { name?: string | null } | null;
              } | null;
            }>;
          };
        }>;
      };
    }>(
      `query ObjectiveProjectAssociations($take: Int!) {
        dataEntries_OkrObjective(take: $take, includeInactive: false) {
          items {
            id
            associations {
              items {
                roles {
                  __typename
                  ... on EntryFieldAssociationRole {
                    key
                    dataCollection
                  }
                }
                entity {
                  __typename
                  ... on Project {
                    id
                    displayName
                    databaseId
                    values { name }
                  }
                }
              }
            }
          }
        }
      }`,
      { take: 200 }
    );

    for (const objective of data.dataEntries_OkrObjective.items ?? []) {
      for (const assoc of objective.associations.items ?? []) {
        const entity = assoc.entity;
        if (entity?.__typename !== "Project" || !entity.id) continue;

        const roles = assoc.roles ?? [];
        const hasZieleRole = roles.some(
          (role) =>
            role?.__typename === "EntryFieldAssociationRole" &&
            role.key === "Ziele"
        );
        // Accept explicit Ziele role, or Project links when roles are empty.
        if (roles.length > 0 && !hasZieleRole) continue;

        addProjectLink(
          map,
          objective.id,
          toLinkedProject({
            id: entity.id,
            name: entity.values?.name,
            displayName: entity.displayName,
            databaseId: entity.databaseId,
          })
        );
      }
    }
  } catch {
    // Associations are optional enrichment; ignore failures.
  }

  return { byObjectiveId: sortProjectMap(map), unauthorized };
}

export async function listProjectsForObjective(
  objectiveId: string
): Promise<{ projects: LinkedProject[]; unauthorized: boolean }> {
  const { byObjectiveId, unauthorized } = await listObjectiveProjectLinks();
  return {
    projects: byObjectiveId[objectiveId] ?? [],
    unauthorized,
  };
}
