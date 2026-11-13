/**
 * Dev helper: seed/repair OKR data forms using .env.local credentials.
 * Preferred path for end users: /setup wizard.
 */
import { readFileSync } from "node:fs";
import { seedOkrDataForms } from "../src/lib/consolidate/seed";

async function main() {
  const env = Object.fromEntries(
    readFileSync(".env.local", "utf8")
      .split(/\r?\n/)
      .filter(Boolean)
      .map((line) => {
        const i = line.indexOf("=");
        return [line.slice(0, i), line.slice(i + 1)];
      })
  );

  const apiUrl = env.CONSOLIDATE_API_URL;
  const apiKey = env.CONSOLIDATE_API_KEY;

  if (!apiUrl || !apiKey) {
    console.error(
      "Missing CONSOLIDATE_API_URL / CONSOLIDATE_API_KEY in .env.local"
    );
    process.exit(1);
  }

  const results = await seedOkrDataForms({ apiUrl, apiKey });
  for (const row of results) {
    console.log(
      row.status.toUpperCase().padEnd(8),
      row.dataCollection,
      row.message ?? ""
    );
  }

  const failed = results.filter((r) => r.status === "failed");
  process.exit(failed.length ? 1 : 0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
