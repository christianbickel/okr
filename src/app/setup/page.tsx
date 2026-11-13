import { connection } from "next/server";
import { redirect } from "next/navigation";
import { isSetupComplete } from "@/lib/consolidate/config";
import { getOptionalEnvApiUrl } from "@/lib/consolidate/env";
import { SetupForm } from "./setup-form";

export default async function SetupPage() {
  await connection();
  if (await isSetupComplete()) {
    redirect("/dashboard");
  }

  const defaultApiUrl =
    getOptionalEnvApiUrl()?.replace(/\/graphql\/?$/, "") ??
    "https://staging.consi.cloud";

  return (
    <div className="flex min-h-full flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-md rounded-xl border border-border/80 bg-card p-6 shadow-none">
        <SetupForm defaultApiUrl={defaultApiUrl} />
      </div>
    </div>
  );
}
