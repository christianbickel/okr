import { connection } from "next/server";
import { redirect } from "next/navigation";
import { isSetupComplete } from "@/lib/consolidate/config";

export default async function HomePage() {
  await connection();
  if (await isSetupComplete()) {
    redirect("/dashboard");
  }
  redirect("/setup");
}
