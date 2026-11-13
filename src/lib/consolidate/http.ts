import "server-only";

import {
  ConsolidateApiError,
  type GraphQLResponse,
  type GraphQLVariables,
} from "./errors";

export interface ConsolidateHttpAuth {
  apiKey?: string;
  cookies?: string;
}

export interface ConsolidateHttpResult<T> {
  data: T;
  setCookie: string[];
}

export function mergeCookieHeaders(
  existing: string | undefined,
  setCookies: string[]
): string {
  const map = new Map<string, string>();
  for (const part of (existing ?? "")
    .split(";")
    .map((p) => p.trim())
    .filter(Boolean)) {
    const i = part.indexOf("=");
    if (i > 0) map.set(part.slice(0, i), part.slice(i + 1));
  }
  for (const c of setCookies) {
    const nv = c.split(";")[0]?.trim();
    if (!nv) continue;
    const i = nv.indexOf("=");
    if (i > 0) map.set(nv.slice(0, i), nv.slice(i + 1));
  }
  return [...map.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
}

async function parseGraphqlResponse<T>(
  response: Response
): Promise<{ payload: GraphQLResponse<T>; setCookie: string[] }> {
  const setCookie =
    typeof response.headers.getSetCookie === "function"
      ? response.headers.getSetCookie()
      : response.headers.get("set-cookie")
        ? [response.headers.get("set-cookie") as string]
        : [];

  if (response.status === 401) {
    throw new ConsolidateApiError(
      "Consolidate API: unauthorized (Anmeldung ungültig)",
      401
    );
  }

  if (!response.ok) {
    throw new ConsolidateApiError(
      `Consolidate API HTTP ${response.status}`,
      response.status
    );
  }

  const payload = (await response.json()) as GraphQLResponse<T>;
  return { payload, setCookie };
}

function assertData<T>(
  payload: GraphQLResponse<T>,
  status: number
): T {
  if (payload.errors?.length) {
    throw new ConsolidateApiError(
      payload.errors.map((e) => e.message).join("; "),
      status,
      payload.errors
    );
  }
  if (payload.data === undefined) {
    throw new ConsolidateApiError(
      "Consolidate API returned empty data",
      status
    );
  }
  return payload.data;
}

/**
 * Low-level GraphQL fetch with optional API key and/or Cookie auth.
 */
export async function consolidateHttpGraphql<T>(
  apiUrl: string,
  query: string,
  variables: GraphQLVariables | undefined,
  auth: ConsolidateHttpAuth = {},
  signal?: AbortSignal
): Promise<ConsolidateHttpResult<T>> {
  if (!auth.apiKey && !auth.cookies) {
    throw new ConsolidateApiError(
      "Consolidate: keine Authentifizierung (API-Key oder Session)."
    );
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (auth.apiKey) headers["X-API-Key"] = auth.apiKey;
  if (auth.cookies) headers.Cookie = auth.cookies;

  const response = await fetch(apiUrl, {
    method: "POST",
    headers,
    body: JSON.stringify({ query, variables }),
    signal,
    cache: "no-store",
  });

  const { payload, setCookie } = await parseGraphqlResponse<T>(response);
  return { data: assertData(payload, response.status), setCookie };
}

/** Mutations like `authenticate` that work without prior credentials. */
export async function consolidateHttpGraphqlAnonymous<T>(
  apiUrl: string,
  query: string,
  variables?: GraphQLVariables,
  cookies?: string,
  signal?: AbortSignal
): Promise<ConsolidateHttpResult<T>> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (cookies) headers.Cookie = cookies;

  const response = await fetch(apiUrl, {
    method: "POST",
    headers,
    body: JSON.stringify({ query, variables }),
    signal,
    cache: "no-store",
  });

  const { payload, setCookie } = await parseGraphqlResponse<T>(response);
  return { data: assertData(payload, response.status), setCookie };
}
