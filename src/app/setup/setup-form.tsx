"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { completeSetupAction, type SetupState } from "./actions";

const initialState: SetupState = { status: "idle" };

interface SetupFormProps {
  defaultApiUrl?: string;
}

export function SetupForm({ defaultApiUrl = "" }: SetupFormProps) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(
    completeSetupAction,
    initialState
  );

  useEffect(() => {
    if (state.status === "success") {
      router.replace("/dashboard");
      router.refresh();
    }
  }, [state, router]);

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Consolidate verbinden
        </h1>
        <p className="text-sm text-muted-foreground text-pretty">
          Beim ersten Start trägst du die GraphQL-URL und einen API-Key mit
          Admin-Rechten ein. Anschließend werden die OKR-Datensammlungen in
          dieser Instanz angelegt.
        </p>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="apiUrl">Consolidate-URL</Label>
        <Input
          id="apiUrl"
          name="apiUrl"
          type="url"
          required
          placeholder="https://intern.consi.cloud"
          defaultValue={defaultApiUrl}
          autoComplete="url"
        />
        <p className="text-xs text-muted-foreground">
          Basis-URL oder vollständiger GraphQL-Endpunkt (
          <code className="text-[11px]">…/graphql/</code>).
        </p>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="apiKey">API-Key</Label>
        <Input
          id="apiKey"
          name="apiKey"
          type="password"
          required
          placeholder="sk_…"
          autoComplete="off"
        />
        <p className="text-xs text-muted-foreground">
          Persönlicher oder Service-User-Key mit Recht zum Anlegen von
          Datensammlungen.
        </p>
      </div>

      {state.status === "error" ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
          {state.message}
        </p>
      ) : null}

      {state.status === "success" ? (
        <div className="space-y-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-800 dark:text-emerald-300">
          <p>Setup als {state.setupBy} abgeschlossen. Weiterleitung…</p>
          <ul className="space-y-1 text-xs">
            {state.seedResults.map((row) => (
              <li key={row.dataCollection}>
                {row.dataCollection}: {row.status}
                {row.message ? ` — ${row.message}` : ""}
              </li>
            ))}
          </ul>
          <p className="text-xs text-pretty">
            Danach in Consolidate unter Rollen/Service-User die Rechte{" "}
            <code className="text-[11px]">DataEntries.Okr*</code> aktivieren —
            sonst schlägt Speichern fehl.
          </p>
        </div>
      ) : null}

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Verbinden & Seed läuft…" : "Verbinden und Seed starten"}
      </Button>
    </form>
  );
}
