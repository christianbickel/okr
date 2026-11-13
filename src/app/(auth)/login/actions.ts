"use server";

import { redirect } from "next/navigation";
import {
  clearAuthSession,
  clearPendingTwoFactor,
  getAuthSession,
  getPendingTwoFactor,
  setAuthSession,
  setPendingTwoFactor,
} from "@/lib/auth/session";
import { readInstanceConfig } from "@/lib/consolidate/config";
import {
  loginWithApiKey,
  loginWithPassword,
  loginWithTwoFactor,
  revokeSessionApiKey,
} from "@/lib/consolidate/login";

export type LoginActionResult =
  | { ok: true }
  | { ok: false; error: string; needsTwoFactor?: boolean };

async function requireApiUrl() {
  const config = await readInstanceConfig();
  if (!config?.apiUrl) {
    return null;
  }
  return config.apiUrl;
}

/** Only allow same-origin relative paths (open redirect safe). */
function safeNextPath(raw: FormDataEntryValue | null): string {
  const value = String(raw ?? "").trim();
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("://")) {
    return "/dashboard";
  }
  return value;
}

export async function loginWithPasswordAction(
  _prev: LoginActionResult | null,
  formData: FormData
): Promise<LoginActionResult> {
  try {
    const apiUrl = await requireApiUrl();
    if (!apiUrl) {
      return {
        ok: false,
        error: "Consolidate ist noch nicht konfiguriert. Bitte Setup ausführen.",
      };
    }
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    if (!email || !password) {
      return { ok: false, error: "E-Mail und Passwort ausfüllen." };
    }

    const result = await loginWithPassword(apiUrl, email, password);
    if (!result.ok) {
      if (result.reason === "two_factor" && result.pendingCookies) {
        await setPendingTwoFactor(result.pendingCookies);
        return { ok: false, error: result.message, needsTwoFactor: true };
      }
      return { ok: false, error: result.message };
    }

    await clearPendingTwoFactor();
    await setAuthSession(result.session);
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Anmeldung fehlgeschlagen",
    };
  }
  redirect(safeNextPath(formData.get("next")));
}

export async function loginWithTwoFactorAction(
  _prev: LoginActionResult | null,
  formData: FormData
): Promise<LoginActionResult> {
  try {
    const apiUrl = await requireApiUrl();
    if (!apiUrl) {
      return {
        ok: false,
        error: "Consolidate ist noch nicht konfiguriert. Bitte Setup ausführen.",
        needsTwoFactor: true,
      };
    }
    const code = String(formData.get("code") ?? "").trim();
    const pending = await getPendingTwoFactor();
    if (!pending?.cookies) {
      return {
        ok: false,
        error: "2FA-Sitzung abgelaufen. Bitte erneut mit E-Mail/Passwort anmelden.",
      };
    }
    if (!code) return { ok: false, error: "Bitte den 2FA-Code eingeben.", needsTwoFactor: true };

    const result = await loginWithTwoFactor(apiUrl, pending.cookies, code, true);
    if (!result.ok) {
      if (result.pendingCookies) await setPendingTwoFactor(result.pendingCookies);
      return {
        ok: false,
        error: result.message,
        needsTwoFactor: true,
      };
    }

    await clearPendingTwoFactor();
    await setAuthSession(result.session);
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "2FA fehlgeschlagen",
      needsTwoFactor: true,
    };
  }
  redirect(safeNextPath(formData.get("next")));
}

export async function loginWithApiKeyAction(
  _prev: LoginActionResult | null,
  formData: FormData
): Promise<LoginActionResult> {
  try {
    const apiUrl = await requireApiUrl();
    if (!apiUrl) {
      return {
        ok: false,
        error: "Consolidate ist noch nicht konfiguriert. Bitte Setup ausführen.",
      };
    }
    const apiKey = String(formData.get("apiKey") ?? "").trim();
    if (!apiKey) return { ok: false, error: "API-Key ausfüllen." };

    const session = await loginWithApiKey(apiUrl, apiKey);
    await clearPendingTwoFactor();
    await setAuthSession(session);
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error ? error.message : "API-Key ungültig oder ohne Zugriff",
    };
  }
  redirect(safeNextPath(formData.get("next")));
}

export async function logoutAction(): Promise<void> {
  const config = await readInstanceConfig();
  const session = await getAuthSession();
  if (config?.apiUrl && session) {
    await revokeSessionApiKey(config.apiUrl, session);
  }
  await clearPendingTwoFactor();
  await clearAuthSession();
  redirect("/login");
}
