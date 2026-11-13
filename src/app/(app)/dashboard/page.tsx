import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth/session";
import { getCurrentConsolidateUser } from "@/lib/consolidate/client";
import { isSetupComplete } from "@/lib/consolidate/config";
import { LiveOkrSection } from "./live-okr-section";

async function ensureSetup() {
  if (!(await isSetupComplete())) {
    redirect("/setup");
  }
}

async function ConnectionStatus() {
  await ensureSetup();
  const session = await getAuthSession();
  if (session) {
    return (
      <span className="text-foreground">
        {session.user.displayName}
        {session.method === "password" ? " (Passwort)" : " (API-Key)"}
      </span>
    );
  }
  try {
    const me = await getCurrentConsolidateUser({
      preferServiceCredentials: true,
    });
    return (
      <span className="text-foreground">
        {me.user.displayName || me.user.email}{" "}
        <Link href="/login" className="underline">
          (anmelden)
        </Link>
      </span>
    );
  } catch {
    return (
      <span className="text-foreground">
        API-Fehler ·{" "}
        <Link href="/login" className="underline">
          Anmelden
        </Link>
      </span>
    );
  }
}

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Live-Objectives aus Consolidate. Verbunden als:{" "}
          <Suspense fallback={<span className="text-foreground">…</span>}>
            <ConnectionStatus />
          </Suspense>
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">
          Aktuelle Objectives
        </h2>
        <Suspense
          fallback={
            <div className="h-64 animate-pulse rounded-xl bg-muted/50" />
          }
        >
          <LiveOkrSection />
        </Suspense>
      </section>
    </div>
  );
}
