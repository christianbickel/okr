/**
 * Optional env fallbacks for local development only.
 * Production path: first-run setup writes `data/consolidate-config.json`.
 */

export function getOptionalEnvApiUrl(): string | undefined {
  return process.env.CONSOLIDATE_API_URL?.trim() || undefined;
}

export function getOptionalEnvApiKey(): string | undefined {
  return process.env.CONSOLIDATE_API_KEY?.trim() || undefined;
}
