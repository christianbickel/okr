"use server";

import {
  normalizeApiUrl,
  writeInstanceConfig,
  type SeedCollectionResult,
} from "@/lib/consolidate/config";
import { validateConsolidateConnection } from "@/lib/consolidate/client";
import { seedOkrDataForms } from "@/lib/consolidate/seed";

export type SetupState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | {
      status: "success";
      setupBy: string;
      seedResults: SeedCollectionResult[];
    };

export async function completeSetupAction(
  _prev: SetupState,
  formData: FormData
): Promise<SetupState> {
  const apiUrlRaw = String(formData.get("apiUrl") ?? "");
  const apiKey = String(formData.get("apiKey") ?? "").trim();

  if (!apiUrlRaw.trim() || !apiKey) {
    return {
      status: "error",
      message: "Bitte Consolidate-URL und API-Key ausfüllen.",
    };
  }

  let apiUrl: string;
  try {
    apiUrl = normalizeApiUrl(apiUrlRaw);
    // Basic URL validation
    // eslint-disable-next-line no-new
    new URL(apiUrl);
  } catch {
    return {
      status: "error",
      message: "Die Consolidate-URL ist ungültig.",
    };
  }

  try {
    const me = await validateConsolidateConnection(apiUrl, apiKey);
    const setupBy = me.user.displayName || me.user.email;

    const seedResults = await seedOkrDataForms({ apiUrl, apiKey });
    const failed = seedResults.filter((r) => r.status === "failed");

    if (failed.length > 0) {
      // Persist credentials anyway so retry/seed is possible later
      await writeInstanceConfig({
        apiUrl,
        apiKey,
        setupBy,
        setupAt: new Date().toISOString(),
        seedResults,
      });

      return {
        status: "error",
        message: `Verbindung OK, aber Seed fehlgeschlagen: ${failed
          .map((f) => `${f.dataCollection}: ${f.message}`)
          .join(" · ")}`,
      };
    }

    await writeInstanceConfig({
      apiUrl,
      apiKey,
      setupBy,
      setupAt: new Date().toISOString(),
      seededAt: new Date().toISOString(),
      seedResults,
    });

    return {
      status: "success",
      setupBy,
      seedResults,
    };
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Verbindung zu Consolidate fehlgeschlagen.",
    };
  }
}
