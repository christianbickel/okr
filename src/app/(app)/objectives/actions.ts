"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createCheckIn,
  createKeyResult,
  createObjective,
  deleteEntries,
  updateObjective,
} from "@/lib/consolidate/okr-repository";
import { objectivePath } from "@/lib/okr/paths";
import type {
  CheckInInput,
  MetricType,
  ObjectiveLevel,
  ObjectiveLifecycleStatus,
  TrafficStatus,
} from "@/lib/okr/types";

export type ActionResult =
  | { ok: true; id?: string }
  | { ok: false; error: string };

function str(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function num(formData: FormData, key: string, fallback = 0) {
  const raw = str(formData, key);
  if (!raw) return fallback;
  return Number(raw);
}

function requireOwnerId(formData: FormData): string {
  const ownerId = str(formData, "ownerId");
  if (!ownerId) {
    throw new Error("Bitte einen Owner aus der Benutzerliste wählen.");
  }
  return ownerId;
}

export async function createObjectiveAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  let objectiveId: string;
  try {
    const objective = await createObjective({
      title: str(formData, "title"),
      descriptionHtml: str(formData, "description")
        ? `<p>${str(formData, "description")}</p>`
        : undefined,
      level: str(formData, "level") as ObjectiveLevel,
      cycleId: str(formData, "cycleId"),
      status: (str(formData, "status") || "draft") as ObjectiveLifecycleStatus,
      parentObjectiveId: str(formData, "parentObjectiveId") || undefined,
      ownerId: requireOwnerId(formData),
      teamName: str(formData, "teamName") || undefined,
      progress: 0,
      weight: num(formData, "weight", 1),
    });
    objectiveId = objective.id;
    revalidatePath("/objectives");
    revalidatePath("/dashboard");
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Anlegen fehlgeschlagen",
    };
  }
  // redirect() throws NEXT_REDIRECT — must stay outside try/catch
  redirect(objectivePath(objectiveId, { newKr: true }));
}

export async function updateObjectiveAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    const id = str(formData, "id");
    await updateObjective(
      id,
      {
        title: str(formData, "title"),
        descriptionHtml: str(formData, "description")
          ? `<p>${str(formData, "description")}</p>`
          : undefined,
        level: str(formData, "level") as ObjectiveLevel,
        cycleId: str(formData, "cycleId"),
        status: str(formData, "status") as ObjectiveLifecycleStatus,
        parentObjectiveId: str(formData, "parentObjectiveId") || undefined,
        ownerId: requireOwnerId(formData),
        teamName: str(formData, "teamName") || undefined,
        weight: num(formData, "weight", 1),
      },
      str(formData, "changeVector") || undefined
    );
    revalidatePath("/objectives");
    revalidatePath(objectivePath(id));
    revalidatePath("/dashboard");
    return { ok: true, id };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Update fehlgeschlagen",
    };
  }
}

export async function deleteObjectiveAction(id: string): Promise<ActionResult> {
  try {
    await deleteEntries([id]);
    revalidatePath("/objectives");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Löschen fehlgeschlagen",
    };
  }
}

export async function createKeyResultAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    const objectiveId = str(formData, "objectiveId");
    const kr = await createKeyResult({
      title: str(formData, "title"),
      objectiveId,
      ownerId: requireOwnerId(formData),
      metricType: str(formData, "metricType") as MetricType,
      unit: str(formData, "unit") || undefined,
      status: (str(formData, "status") || "on_track") as TrafficStatus,
      startValue: num(formData, "startValue"),
      targetValue: num(formData, "targetValue"),
      currentValue: num(formData, "currentValue", num(formData, "startValue")),
      weight: num(formData, "weight", 1),
      dueDate: str(formData, "dueDate") || undefined,
    });
    revalidatePath(objectivePath(objectiveId));
    revalidatePath("/objectives");
    revalidatePath("/dashboard");
    return { ok: true, id: kr.id };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "KR anlegen fehlgeschlagen",
    };
  }
}

export async function deleteKeyResultAction(
  id: string,
  objectiveId: string
): Promise<ActionResult> {
  try {
    await deleteEntries([id]);
    revalidatePath(objectivePath(objectiveId));
    revalidatePath("/objectives");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Löschen fehlgeschlagen",
    };
  }
}

export async function submitCheckInAction(
  input: CheckInInput & { objectiveId?: string }
): Promise<ActionResult> {
  try {
    const checkIn = await createCheckIn(input);
    revalidatePath("/objectives");
    revalidatePath("/dashboard");
    if (input.objectiveId) {
      revalidatePath(objectivePath(input.objectiveId));
    }
    return { ok: true, id: checkIn.id };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error ? error.message : "Check-in fehlgeschlagen",
    };
  }
}
