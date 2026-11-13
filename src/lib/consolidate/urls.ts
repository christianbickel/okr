/** App origin from GraphQL endpoint (`…/graphql/` → `https://host`). */
export function consolidateAppOrigin(apiUrl: string): string {
  return apiUrl.replace(/\/graphql\/?$/, "").replace(/\/+$/, "");
}

/** Consolidate SPA deep-link for any data entry (Project, Objective, …). */
export function consolidateEntryUrl(apiUrl: string, entryId: string): string {
  return `${consolidateAppOrigin(apiUrl)}/entry/${encodeURIComponent(entryId)}`;
}

/** Consolidate online viewer for an attachment (`/editor/view/:id`). */
export function consolidateAttachmentViewUrl(
  apiUrl: string,
  attachmentId: string
): string {
  return `${consolidateAppOrigin(apiUrl)}/editor/view/${encodeURIComponent(attachmentId)}`;
}

/** Absolute URL for Consolidate download/preview paths. */
export function resolveConsolidateAssetUrl(
  apiUrl: string,
  maybeRelative: string
): string {
  if (/^https?:\/\//i.test(maybeRelative) || maybeRelative.startsWith("blob:")) {
    return maybeRelative;
  }
  return new URL(
    maybeRelative,
    `${consolidateAppOrigin(apiUrl)}/`
  ).toString();
}

/** Same helper Consolidate uses for image/PDF thumbnails. */
export function withThumbnailQuery(downloadUrl: string): string {
  if (downloadUrl.startsWith("blob:")) return downloadUrl;
  const sep = downloadUrl.includes("?") ? "&" : "?";
  return `${downloadUrl}${sep}thumbnail=true`;
}
