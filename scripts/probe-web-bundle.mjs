const js = await (
  await fetch("https://staging.consi.cloud/assets/main-DTQ_t-K4.js")
).text();
console.log("len", js.length);

const patterns = [
  /path:"[^"]+"/g,
  /path:'[^']+'/g,
  /"\/[a-zA-Z0-9_\-/:{}]+"/g,
];

for (const p of patterns) {
  const m = [...js.matchAll(p)].map((x) => x[0]);
  const unique = [...new Set(m)].filter((s) =>
    /project|Project|entry|data|detail|:id/i.test(s)
  );
  if (unique.length) {
    console.log("\npattern", String(p));
    console.log(unique.slice(0, 80).join("\n"));
  }
}

const idx = js.indexOf("Project");
console.log("\nsnippets around Project:");
for (const key of [
  "projects/",
  "/project/",
  "Project/",
  "dataCollection",
  "openEntry",
  "entryUrl",
  "permalink",
  "shareLink",
  "navigateTo",
]) {
  let from = 0;
  let n = 0;
  while (n < 5) {
    const i = js.indexOf(key, from);
    if (i < 0) break;
    console.log("\n", key, "@", i, js.slice(Math.max(0, i - 40), i + 80).replace(/\n/g, " "));
    from = i + key.length;
    n++;
  }
}
