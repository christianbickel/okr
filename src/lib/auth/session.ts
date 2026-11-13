import "server-only";

import { cookies } from "next/headers";
import type { OkrUserRef } from "@/lib/okr/types";

export const AUTH_COOKIE = "okr_auth";

export type AuthMethod = "password" | "apiKey";

export interface AuthSession {
  method: AuthMethod;
  user: OkrUserRef;
  /** Prefer personal API key for GraphQL (`X-API-Key`). */
  apiKey?: string;
  /** Id of an API key created for this OKR session (logout cleanup). */
  apiKeyId?: string;
  /** Consolidate browser-session cookies after password login (fallback). */
  cookies?: string;
}

function encodeSession(session: AuthSession): string {
  return Buffer.from(JSON.stringify(session), "utf8").toString("base64url");
}

function decodeSession(raw: string): AuthSession | null {
  try {
    const parsed = JSON.parse(
      Buffer.from(raw, "base64url").toString("utf8")
    ) as AuthSession;
    if (!parsed?.user?.id || !parsed.method) return null;
    if (!parsed.apiKey && !parsed.cookies) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function getAuthSession(): Promise<AuthSession | null> {
  const jar = await cookies();
  const raw = jar.get(AUTH_COOKIE)?.value;
  if (!raw) return null;
  return decodeSession(raw);
}

export async function setAuthSession(session: AuthSession): Promise<void> {
  const jar = await cookies();
  jar.set(AUTH_COOKIE, encodeSession(session), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
}

export async function clearAuthSession(): Promise<void> {
  const jar = await cookies();
  jar.delete(AUTH_COOKIE);
}

/** Temporary cookie while waiting for 2FA after password step. */
export const PENDING_2FA_COOKIE = "okr_auth_2fa";

export interface PendingTwoFactor {
  cookies: string;
}

export async function setPendingTwoFactor(cookiesHeader: string): Promise<void> {
  const jar = await cookies();
  jar.set(
    PENDING_2FA_COOKIE,
    Buffer.from(JSON.stringify({ cookies: cookiesHeader }), "utf8").toString(
      "base64url"
    ),
    {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 10,
    }
  );
}

export async function getPendingTwoFactor(): Promise<PendingTwoFactor | null> {
  const jar = await cookies();
  const raw = jar.get(PENDING_2FA_COOKIE)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(
      Buffer.from(raw, "base64url").toString("utf8")
    ) as PendingTwoFactor;
  } catch {
    return null;
  }
}

export async function clearPendingTwoFactor(): Promise<void> {
  const jar = await cookies();
  jar.delete(PENDING_2FA_COOKIE);
}
