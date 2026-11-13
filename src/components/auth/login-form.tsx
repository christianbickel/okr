"use client";

import { useActionState, useState } from "react";
import {
  loginWithApiKeyAction,
  loginWithPasswordAction,
  loginWithTwoFactorAction,
  type LoginActionResult,
} from "@/app/(auth)/login/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Mode = "password" | "apiKey";

const initial: LoginActionResult | null = null;

interface LoginFormProps {
  setupReady: boolean;
  /** Relative path to open after successful login. */
  nextPath?: string;
}

export function LoginForm({ setupReady, nextPath = "/dashboard" }: LoginFormProps) {
  const [mode, setMode] = useState<Mode>("password");
  const [passwordState, passwordAction, passwordPending] = useActionState(
    loginWithPasswordAction,
    initial
  );
  const [twoFactorState, twoFactorAction, twoFactorPending] = useActionState(
    loginWithTwoFactorAction,
    initial
  );
  const [apiKeyState, apiKeyAction, apiKeyPending] = useActionState(
    loginWithApiKeyAction,
    initial
  );

  const needsTwoFactor =
    passwordState?.ok === false && passwordState.needsTwoFactor
      ? true
      : twoFactorState?.ok === false && twoFactorState.needsTwoFactor
        ? true
        : false;

  if (!setupReady) {
    return (
      <p className="text-sm text-muted-foreground">
        Zuerst unter{" "}
        <a href="/setup" className="underline">
          Setup
        </a>{" "}
        die Consolidate-URL konfigurieren.
      </p>
    );
  }

  if (needsTwoFactor) {
    const error =
      (twoFactorState && !twoFactorState.ok && twoFactorState.error) ||
      (passwordState && !passwordState.ok && passwordState.error);
    return (
      <form action={twoFactorAction} className="space-y-4">
        <input type="hidden" name="next" value={nextPath} />
        <div className="space-y-1">
          <h2 className="text-base font-medium">Zwei-Faktor-Authentifizierung</h2>
          <p className="text-sm text-muted-foreground">
            Gib den Code aus deiner Authenticator-App ein.
          </p>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="code">Code</Label>
          <Input
            id="code"
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            required
            autoFocus
          />
        </div>
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        <Button type="submit" className="w-full" disabled={twoFactorPending}>
          {twoFactorPending ? "Prüfen…" : "Bestätigen"}
        </Button>
      </form>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-1 rounded-lg border border-border/80 p-1">
        <button
          type="button"
          onClick={() => setMode("password")}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm transition-colors",
            mode === "password"
              ? "bg-muted font-medium text-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          E-Mail & Passwort
        </button>
        <button
          type="button"
          onClick={() => setMode("apiKey")}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm transition-colors",
            mode === "apiKey"
              ? "bg-muted font-medium text-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          API-Key
        </button>
      </div>

      {mode === "password" ? (
        <form action={passwordAction} className="space-y-4">
          <input type="hidden" name="next" value={nextPath} />
          <div className="grid gap-2">
            <Label htmlFor="email">E-Mail</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              required
              placeholder="name@firma.de"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Passwort</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>
          {passwordState && !passwordState.ok ? (
            <p className="text-sm text-destructive" role="alert">
              {passwordState.error}
            </p>
          ) : null}
          <Button type="submit" className="w-full" disabled={passwordPending}>
            {passwordPending ? "Anmelden…" : "Anmelden"}
          </Button>
        </form>
      ) : (
        <form action={apiKeyAction} className="space-y-4">
          <input type="hidden" name="next" value={nextPath} />
          <div className="grid gap-2">
            <Label htmlFor="apiKey">Persönlicher API-Key</Label>
            <Input
              id="apiKey"
              name="apiKey"
              type="password"
              autoComplete="off"
              required
              placeholder="sk_…"
            />
            <p className="text-xs text-muted-foreground">
              Header <code className="text-xs">X-API-Key</code> aus Consolidate →
              Einstellungen → API Keys.
            </p>
          </div>
          {apiKeyState && !apiKeyState.ok ? (
            <p className="text-sm text-destructive" role="alert">
              {apiKeyState.error}
            </p>
          ) : null}
          <Button type="submit" className="w-full" disabled={apiKeyPending}>
            {apiKeyPending ? "Prüfen…" : "Mit API-Key anmelden"}
          </Button>
        </form>
      )}
    </div>
  );
}
