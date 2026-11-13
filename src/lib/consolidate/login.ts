import "server-only";

import type { AuthSession } from "@/lib/auth/session";
import { ConsolidateApiError } from "./errors";
import {
  consolidateHttpGraphql,
  consolidateHttpGraphqlAnonymous,
  mergeCookieHeaders,
} from "./http";

export interface SignInFlags {
  succeeded: boolean;
  requiresTwoFactor: boolean;
  isLockedOut: boolean;
  requiresPasswordChange: boolean;
}

async function fetchMe(apiUrl: string, auth: { apiKey?: string; cookies?: string }) {
  const { data } = await consolidateHttpGraphql<{
    me: { id: string; user: { email: string; displayName: string } };
  }>(
    apiUrl,
    `query Me {
      me {
        id
        user { email displayName }
      }
    }`,
    undefined,
    auth
  );
  return data.me;
}

async function tryCreateSessionApiKey(
  apiUrl: string,
  cookies: string
): Promise<{ apiKey: string; apiKeyId: string } | null> {
  try {
    const { data } = await consolidateHttpGraphql<{
      createApiKey: { apiKey: { id: string }; secretKey: string };
    }>(
      apiUrl,
      `mutation($input: CreateApiKeyInput!) {
        createApiKey(input: $input) {
          apiKey { id }
          secretKey
        }
      }`,
      {
        input: {
          name: `OKR Add-on ${new Date().toISOString().slice(0, 16)}`,
        },
      },
      { cookies }
    );
    return {
      apiKey: data.createApiKey.secretKey,
      apiKeyId: data.createApiKey.apiKey.id,
    };
  } catch {
    return null;
  }
}

function toSessionUser(me: {
  id: string;
  user: { email: string; displayName: string };
}) {
  return {
    id: me.id,
    displayName: me.user.displayName || me.user.email || me.id,
    email: me.user.email,
  };
}

export type PasswordLoginResult =
  | { ok: true; session: AuthSession }
  | {
      ok: false;
      reason:
        | "invalid"
        | "locked"
        | "password_change"
        | "two_factor"
        | "error";
      message: string;
      pendingCookies?: string;
    };

export async function loginWithPassword(
  apiUrl: string,
  username: string,
  password: string
): Promise<PasswordLoginResult> {
  try {
    const { data, setCookie } = await consolidateHttpGraphqlAnonymous<{
      authenticate: { signInResult: SignInFlags };
    }>(
      apiUrl,
      `mutation($input: AuthenticateInput!) {
        authenticate(input: $input) {
          signInResult {
            succeeded
            requiresTwoFactor
            isLockedOut
            requiresPasswordChange
          }
        }
      }`,
      { input: { username, password } }
    );

    const result = data.authenticate.signInResult;
    const cookieHeader = mergeCookieHeaders(undefined, setCookie);

    if (result.isLockedOut) {
      return {
        ok: false,
        reason: "locked",
        message: "Konto ist gesperrt. Bitte später erneut versuchen.",
      };
    }
    if (result.requiresPasswordChange) {
      return {
        ok: false,
        reason: "password_change",
        message:
          "Passwortänderung erforderlich. Bitte zuerst in Consolidate anmelden.",
      };
    }
    if (result.requiresTwoFactor) {
      return {
        ok: false,
        reason: "two_factor",
        message: "Zwei-Faktor-Code erforderlich.",
        pendingCookies: cookieHeader || undefined,
      };
    }
    if (!result.succeeded) {
      return {
        ok: false,
        reason: "invalid",
        message: "E-Mail oder Passwort ungültig.",
      };
    }

    if (!cookieHeader) {
      return {
        ok: false,
        reason: "error",
        message:
          "Anmeldung ohne Session-Cookie. Bitte API-Key verwenden oder Consolidate-Version prüfen.",
      };
    }

    return finishPasswordSession(apiUrl, cookieHeader);
  } catch (error) {
    return {
      ok: false,
      reason: "error",
      message:
        error instanceof Error ? error.message : "Anmeldung fehlgeschlagen",
    };
  }
}

export async function loginWithTwoFactor(
  apiUrl: string,
  pendingCookies: string,
  code: string,
  rememberClient = true
): Promise<PasswordLoginResult> {
  try {
    const { data, setCookie } = await consolidateHttpGraphqlAnonymous<{
      authenticateTwoFactor: { signInResult: SignInFlags };
    }>(
      apiUrl,
      `mutation($input: AuthenticateTwoFactorInput!) {
        authenticateTwoFactor(input: $input) {
          signInResult {
            succeeded
            requiresTwoFactor
            isLockedOut
            requiresPasswordChange
          }
        }
      }`,
      { input: { code, rememberClient } },
      pendingCookies
    );

    const result = data.authenticateTwoFactor.signInResult;
    const cookieHeader = mergeCookieHeaders(pendingCookies, setCookie);

    if (!result.succeeded) {
      return {
        ok: false,
        reason: "invalid",
        message: "Zwei-Faktor-Code ungültig.",
        pendingCookies: cookieHeader || pendingCookies,
      };
    }

    return finishPasswordSession(apiUrl, cookieHeader);
  } catch (error) {
    return {
      ok: false,
      reason: "error",
      message:
        error instanceof Error ? error.message : "2FA-Anmeldung fehlgeschlagen",
    };
  }
}

async function finishPasswordSession(
  apiUrl: string,
  cookieHeader: string
): Promise<PasswordLoginResult> {
  const me = await fetchMe(apiUrl, { cookies: cookieHeader });
  const created = await tryCreateSessionApiKey(apiUrl, cookieHeader);

  if (created) {
    return {
      ok: true,
      session: {
        method: "password",
        user: toSessionUser(me),
        apiKey: created.apiKey,
        apiKeyId: created.apiKeyId,
      },
    };
  }

  return {
    ok: true,
    session: {
      method: "password",
      user: toSessionUser(me),
      cookies: cookieHeader,
    },
  };
}

export async function loginWithApiKey(
  apiUrl: string,
  apiKey: string
): Promise<AuthSession> {
  const me = await fetchMe(apiUrl, { apiKey });
  return {
    method: "apiKey",
    user: toSessionUser(me),
    apiKey,
  };
}

export async function revokeSessionApiKey(
  apiUrl: string,
  session: AuthSession
): Promise<void> {
  if (!session.apiKeyId || !session.apiKey) return;
  try {
    await consolidateHttpGraphql(
      apiUrl,
      `mutation($input: DeleteApiKeyInput!) {
        deleteApiKey(input: $input) { __typename }
      }`,
      { input: { id: session.apiKeyId } },
      { apiKey: session.apiKey }
    );
  } catch (error) {
    if (!(error instanceof ConsolidateApiError)) throw error;
  }
}
