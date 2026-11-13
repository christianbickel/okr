"use server";

import { revalidatePath } from "next/cache";
import {
  createCycle,
  deleteEntries,
  updateCycle,
} from "@/lib/consolidate/okr-repository";
import type { CycleStatus, CycleType } from "@/lib/okr/types";

export type ActionResult =
  | { ok: true; id?: string }
  | { ok: false; error: string };

function str(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export async function createCycleAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    const cycle = await createCycle({
      title: str(formData, "title"),
      descriptionHtml: str(formData, "description")
        ? `<p>${str(formData, "description")}</p>`
        : undefined,
      startDate: str(formData, "startDate"),
      endDate: str(formData, "endDate"),
      cycleType: str(formData, "cycleType") as CycleType,
      status: str(formData, "status") as CycleStatus,
    });
    revalidatePath("/cycles");
    revalidatePath("/dashboard");
    revalidatePath("/objectives");
    return { ok: true, id: cycle.id };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Anlegen fehlgeschlagen",
    };
  }
}

export async function updateCycleAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    const id = str(formData, "id");
    await updateCycle(
      id,
      {
        title: str(formData, "title"),
        descriptionHtml: str(formData, "description")
          ? `<p>${str(formData, "description")}</p>`
          : undefined,
        startDate: str(formData, "startDate"),
        endDate: str(formData, "endDate"),
        cycleType: str(formData, "cycleType") as CycleType,
        status: str(formData, "status") as CycleStatus,
      },
      str(formData, "changeVector") || undefined
    );
    revalidatePath("/cycles");
    revalidatePath("/dashboard");
    return { ok: true, id };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Update fehlgeschlagen",
    };
  }
}

export async function deleteCycleAction(id: string): Promise<ActionResult> {
  try {
    await deleteEntries([id]);
    revalidatePath("/cycles");
    revalidatePath("/dashboard");
    revalidatePath("/objectives");
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Löschen fehlgeschlagen",
    };
  }
}
