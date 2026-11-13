import "server-only";

import { getAuthSession } from "@/lib/auth/session";
import type { OkrUserRef } from "@/lib/okr/types";
import { readInstanceConfig } from "./config";
import {
  ConsolidateApiError,
  type GraphQLVariables,
} from "./errors";
import { consolidateHttpGraphql } from "./http";

export type { GraphQLVariables, GraphQLResponse } from "./errors";
export { ConsolidateApiError } from "./errors";

export interface ConsolidateClientOptions {
  apiUrl?: string;
  apiKey?: string;
  cookies?: string;
  /** Skip user session and use instance/service credentials only. */
  preferServiceCredentials?: boolean;
  signal?: AbortSignal;
}

export async function resolveConsolidateAuth(
  options: ConsolidateClientOptions = {}
) {
  if (options.apiUrl && (options.apiKey || options.cookies)) {
    return {
      apiUrl: options.apiUrl,
      apiKey: options.apiKey,
      cookies: options.cookies,
    };
  }

  const config = await readInstanceConfig();
  if (!config?.apiUrl) {
    throw new ConsolidateApiError(
      "Consolidate ist noch nicht konfiguriert. Bitte Setup ausführen."
    );
  }

  if (!options.preferServiceCredentials) {
    const session = await getAuthSession();
    if (session?.apiKey || session?.cookies) {
      return {
        apiUrl: options.apiUrl ?? config.apiUrl,
        apiKey: options.apiKey ?? session.apiKey,
        cookies: options.cookies ?? session.cookies,
      };
    }
  }

  const apiKey = options.apiKey ?? config.apiKey;
  if (!apiKey) {
    throw new ConsolidateApiError(
      "Nicht angemeldet. Bitte unter /login anmelden oder Setup prüfen."
    );
  }

  return {
    apiUrl: options.apiUrl ?? config.apiUrl,
    apiKey,
    cookies: options.cookies,
  };
}

/**
 * Typed GraphQL client for Consolidate Nitro.
 * Prefer user session (API-Key or password-cookie); fallback: Setup-Service-Key.
 */
export async function consolidateGraphql<T>(
  query: string,
  variables?: GraphQLVariables,
  options: ConsolidateClientOptions = {}
): Promise<T> {
  const auth = await resolveConsolidateAuth(options);
  const { data } = await consolidateHttpGraphql<T>(
    auth.apiUrl,
    query,
    variables,
    { apiKey: auth.apiKey, cookies: auth.cookies },
    options.signal
  );
  return data;
}

/** Authenticated binary fetch against Consolidate (thumbnails, downloads). */
export async function fetchConsolidateAsset(
  url: string,
  options: ConsolidateClientOptions = {}
): Promise<Response> {
  const auth = await resolveConsolidateAuth(options);
  const headers: Record<string, string> = {};
  if (auth.apiKey) headers["X-API-Key"] = auth.apiKey;
  if (auth.cookies) headers.Cookie = auth.cookies;
  return fetch(url, {
    method: "GET",
    headers,
    redirect: "follow",
    cache: "no-store",
    signal: options.signal,
  });
}

export async function getCurrentConsolidateUser(
  options: ConsolidateClientOptions = {}
) {
  const data = await consolidateGraphql<{
    me: { id: string; user: { email: string; displayName: string } };
  }>(
    `query Me {
      me {
        id
        user { email displayName }
      }
    }`,
    undefined,
    options
  );

  return data.me;
}

/** Active human users for Owner/Author dropdowns (no service users). */
export async function listActiveConsolidateUsers(
  options: ConsolidateClientOptions = {}
): Promise<OkrUserRef[]> {
  const data = await consolidateGraphql<{
    activeUsers: Array<{
      id: string;
      displayName?: string | null;
      email?: string | null;
    }>;
  }>(
    `query ActiveUsers($includeServiceUsers: Boolean!) {
      activeUsers(includeServiceUsers: $includeServiceUsers) {
        id
        displayName
        email
      }
    }`,
    { includeServiceUsers: false },
    options
  );

  return (data.activeUsers ?? [])
    .map((u) => ({
      id: u.id,
      displayName: u.displayName?.trim() || u.email || u.id,
      email: u.email ?? undefined,
    }))
    .sort((a, b) =>
      a.displayName.localeCompare(b.displayName, "de", { sensitivity: "base" })
    );
}

export async function validateConsolidateConnection(
  apiUrl: string,
  apiKey: string
) {
  return getCurrentConsolidateUser({ apiUrl, apiKey });
}
