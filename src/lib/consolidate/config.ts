import "server-only";

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export interface ConsolidateInstanceConfig {
  apiUrl: string;
  apiKey: string;
  /** Display name of the user that completed setup (from `me`). */
  setupBy?: string;
  setupAt?: string;
  seededAt?: string;
  seedResults?: SeedCollectionResult[];
}

export interface SeedCollectionResult {
  dataCollection: string;
  status: "created" | "exists" | "failed";
  message?: string;
  dataFormId?: string;
}

const DATA_DIR = path.join(process.cwd(), "data");
const CONFIG_PATH = path.join(DATA_DIR, "consolidate-config.json");

export function getConfigPath(): string {
  return CONFIG_PATH;
}

export async function readInstanceConfig(): Promise<ConsolidateInstanceConfig | null> {
  try {
    const raw = await readFile(CONFIG_PATH, "utf8");
    const parsed = JSON.parse(raw) as ConsolidateInstanceConfig;
    if (!parsed.apiUrl || !parsed.apiKey) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function isSetupComplete(): Promise<boolean> {
  const config = await readInstanceConfig();
  return Boolean(config?.apiUrl && config?.apiKey && config?.seededAt);
}

export async function writeInstanceConfig(
  config: ConsolidateInstanceConfig
): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(CONFIG_PATH, `${JSON.stringify(config, null, 2)}\n`, "utf8");
}

export function normalizeApiUrl(input: string): string {
  const trimmed = input.trim().replace(/\/+$/, "");
  if (trimmed.endsWith("/graphql")) return `${trimmed}/`;
  return `${trimmed}/graphql/`;
}
