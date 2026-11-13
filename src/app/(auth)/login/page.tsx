import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";
import { readInstanceConfig } from "@/lib/consolidate/config";

function safeNextPath(raw: string | undefined): string {
  const value = (raw ?? "").trim();
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("://")) {
    return "/dashboard";
  }
  return value;
}

async function LoginContent({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const setupReady = Boolean((await readInstanceConfig())?.apiUrl);
  const { next } = await searchParams;

  return (
    <div className="flex min-h-full flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm space-y-4 rounded-xl border border-border/80 bg-card p-6 shadow-none">
        <div className="space-y-1">
          <h1 className="text-lg font-semibold tracking-tight">Anmelden</h1>
          <p className="text-sm text-muted-foreground">
            Mit Consolidate-Konto (E-Mail & Passwort) oder persönlichem API-Key.
          </p>
        </div>
        <LoginForm setupReady={setupReady} nextPath={safeNextPath(next)} />
      </div>
    </div>
  );
}

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-full flex-1 items-center justify-center px-4 py-16">
          <div className="h-64 w-full max-w-sm animate-pulse rounded-xl bg-muted/50" />
        </div>
      }
    >
      <LoginContent searchParams={searchParams} />
    </Suspense>
  );
}
