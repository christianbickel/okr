/** Consolidate Global IDs are Base64 and may contain `+`, `/`, `=`. */

export function objectivePath(id: string, query?: { newKr?: boolean }): string {
  const path = `/objectives/${encodeURIComponent(id)}`;
  if (query?.newKr) return `${path}?newKr=1`;
  return path;
}

export function decodeRouteId(raw: string): string {
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

/** Loose check before hitting Consolidate GraphQL. */
export function looksLikeConsolidateId(id: string): boolean {
  if (!id || id.length < 8) return false;
  // Base64 / base64url alphabet
  return /^[A-Za-z0-9_\-+/=]+$/.test(id);
}
