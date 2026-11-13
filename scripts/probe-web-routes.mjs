import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => {
      const i = line.indexOf("=");
      return [line.slice(0, i), line.slice(i + 1)];
    })
);

const base = env.CONSOLIDATE_API_URL.replace(/\/graphql\/?$/, "");
console.log("base", base);

const candidates = [
  "/",
  "/projects",
  "/project",
  "/Project",
  "/data/Project",
  "/entries/Project",
  "/app/projects",
  "/#/projects",
];

for (const path of candidates) {
  const url = `${base}${path}`;
  try {
    const res = await fetch(url, {
      redirect: "manual",
      headers: { Accept: "text/html" },
    });
    const loc = res.headers.get("location");
    console.log(path, res.status, loc ?? "");
  } catch (e) {
    console.log(path, "ERR", e.message);
  }
}

// Fetch main HTML and look for route hints in JS
const html = await (await fetch(base + "/")).text();
const scripts = [...html.matchAll(/src="([^"]+\.js)"/g)].map((m) => m[1]);
console.log("scripts", scripts.slice(0, 10));

for (const src of scripts.slice(0, 5)) {
  const abs = src.startsWith("http") ? src : `${base}${src}`;
  const js = await (await fetch(abs)).text();
  const hits = js.match(/\/projects?\/[A-Za-z0-9{}$:_-]+/g);
  const hits2 = js.match(/Project\/\$\{[^}]+\}|\/data-entry|\/entries\/|openProject|dataCollection.*path/g);
  if (hits?.length || hits2?.length) {
    console.log("\nfrom", src);
    console.log("hits", [...new Set(hits ?? [])].slice(0, 20));
    console.log("hits2", [...new Set(hits2 ?? [])].slice(0, 30));
  }
}
